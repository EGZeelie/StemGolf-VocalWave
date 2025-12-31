
import React, { useState, useRef } from 'react';
import { BlogPost, CreatorProfile, PodcastProject } from '../types';
import Button from '../components/Button';
import { FileText, Plus, Sparkles, Image as ImageIcon, X, Save, ArrowLeft, Wand2, Calendar, Tag, Trash2, ExternalLink, Link as LinkIcon, Mic, RefreshCw, Layers, Facebook, Share2 } from 'lucide-react';
import { generateBlogContent, generateImage } from '../services/gemini';
import { FacebookService } from '../services/facebook';

interface BlogEditorProps {
  posts: BlogPost[];
  profile: CreatorProfile;
  projects: PodcastProject[];
  onSave: (post: BlogPost) => void;
  onDelete: (id: string) => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ posts, profile, projects, onSave, onDelete }) => {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPostingToFb, setIsPostingToFb] = useState(false);
  
  // AI State
  const [aiSource, setAiSource] = useState<'custom' | 'episode'>('custom');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [linkedEpisodeId, setLinkedEpisodeId] = useState<string>('');

  const handleCreateNew = (openAi: boolean = false) => {
    const newPost: BlogPost = {
      id: `post_${Date.now()}`,
      title: 'New Article',
      excerpt: '',
      content: '',
      author: profile.name,
      date: new Date().toLocaleDateString(),
      createdAt: Date.now(),
      tags: [],
      status: 'draft'
    };
    setEditingPost(newPost);
    syncState(newPost);
    if (openAi) {
      setAiSource('custom');
      setAiTopic('');
      setAiContext('');
      setIsAiModalOpen(true);
    }
  };

  const syncState = (post: BlogPost) => {
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt);
    setTags(post.tags);
    setCoverImage(post.coverImage || '');
    setLinkedEpisodeId(post.linkedEpisodeId || '');
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    syncState(post);
  };

  const handleSaveCurrent = () => {
    if (!editingPost) return;
    const updated: BlogPost = {
      ...editingPost,
      title,
      content,
      excerpt,
      tags,
      coverImage: coverImage || undefined,
      linkedEpisodeId: linkedEpisodeId || undefined,
    };
    onSave(updated);
    setEditingPost(null);
  };

  const handlePostToFacebook = async () => {
    if (!profile.integrations?.facebookPageId || !profile.integrations?.facebookPageAccessToken) {
        alert("Please configure your Facebook Page integration in Creator Settings first.");
        return;
    }
    
    if (!editingPost || editingPost.status !== 'published') {
        alert("Please save and publish the article before sharing.");
        return;
    }

    setIsPostingToFb(true);
    
    // Construct public link (Mocked for demo)
    const publicLink = `https://stemgolf.app/p/${profile.slug}/blog/${editingPost.id}`;
    const message = `${title}\n\n${excerpt}\n\nRead more here:`;

    const result = await FacebookService.postBlogToPage(
        profile.integrations.facebookPageId,
        profile.integrations.facebookPageAccessToken,
        message,
        publicLink
    );

    setIsPostingToFb(false);

    if (result.success) {
        alert("Successfully posted to Facebook Page!");
    } else {
        alert(`Failed to post: ${result.error}`);
    }
  };

  const handleGenerateAI = async () => {
    let finalTopic = aiTopic;
    let finalContext = aiContext;

    if (aiSource === 'episode') {
        const episode = projects.find(p => p.id === selectedEpisodeId);
        if (!episode) return alert("Please select an episode");
        finalTopic = episode.title;
        finalContext = episode.content;
        setLinkedEpisodeId(episode.id); // Auto-link
        
        // Auto-use cover art if available and current is empty
        if (episode.metadata.coverArt && !coverImage) {
            setCoverImage(episode.metadata.coverArt);
        }
    } else {
        if (!aiTopic) return alert("Please enter a topic");
    }

    setIsGenerating(true);
    try {
      const result = await generateBlogContent(finalTopic, finalContext);
      
      setTitle(result.title);
      setContent(result.content);
      setExcerpt(result.excerpt);
      setTags(result.tags);
      setIsAiModalOpen(false);
      
      // Auto-generate image if none exists and not using episode cover
      if (!coverImage && !((aiSource === 'episode' && projects.find(p => p.id === selectedEpisodeId)?.metadata.coverArt))) {
         try {
           const img = await generateImage(result.title + " blog post cover minimal artistic");
           setCoverImage(img);
         } catch (e) { console.error("Image gen failed", e); }
      }
    } catch (e) {
      alert("Failed to generate blog content. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromEpisode = async () => {
     if (!linkedEpisodeId) return;
     const project = projects.find(p => p.id === linkedEpisodeId);
     if (!project || !project.content) {
         alert("Episode not found or has no content.");
         return;
     }

     if (!window.confirm("This will overwrite your current title and content. Continue?")) return;

     setIsGenerating(true);
     try {
         const result = await generateBlogContent(project.title, project.content);
         setTitle(result.title);
         setContent(result.content);
         setExcerpt(result.excerpt);
         setTags(result.tags);
         if (project.metadata.coverArt && !coverImage) {
             setCoverImage(project.metadata.coverArt);
         }
     } catch (e) {
         alert("Failed to generate from episode.");
     } finally {
         setIsGenerating(false);
     }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  // --- RENDER LIST VIEW ---
  if (!editingPost) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Blog & Articles</h1>
            <p className="text-slate-400">Manage your Afrikaans written content.</p>
          </div>
          <Button onClick={() => handleCreateNew(false)}>
            <Plus className="w-4 h-4 mr-2" /> New Article
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create with AI Card */}
          <div 
             onClick={() => handleCreateNew(true)}
             className="group bg-gradient-to-br from-purple-900/20 to-[#181818] border border-purple-500/30 hover:border-purple-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[200px] transition-all"
          >
             <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Wand2 className="w-6 h-6" />
             </div>
             <h3 className="text-white font-bold mb-1">Create with AI</h3>
             <p className="text-xs text-slate-400 text-center">Generate a full article from a topic or transcript.</p>
          </div>

          {posts.map(post => (
            <div key={post.id} className="bg-[#181818] border border-[#272727] rounded-xl overflow-hidden hover:border-slate-500 transition-colors flex flex-col">
               <div className="h-40 bg-[#222] relative overflow-hidden">
                  {post.coverImage ? (
                    <img src={post.coverImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FileText className="w-10 h-10 text-slate-600" /></div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase ${post.status === 'published' ? 'bg-green-500 text-black' : 'bg-slate-700 text-white'}`}>
                     {post.status}
                  </div>
                  {post.linkedEpisodeId && (
                     <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold flex items-center gap-1">
                        <Mic className="w-3 h-3" /> Linked
                     </div>
                  )}
               </div>
               <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{post.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{post.excerpt || 'No excerpt.'}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#272727]">
                     <span className="text-xs text-slate-500">{post.date}</span>
                     <div className="flex gap-2">
                        <button onClick={() => onDelete(post.id)} className="p-1.5 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(post)}>Edit</Button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- RENDER EDITOR VIEW ---
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 relative">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-[#181818] p-4 rounded-xl border border-[#272727]">
         <div className="flex items-center gap-4">
            <button onClick={() => setEditingPost(null)} className="p-2 hover:bg-[#222] rounded-lg text-slate-400 hover:text-white transition-colors">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-[#333]"></div>
            <span className="text-sm font-medium text-slate-300">{editingPost.status === 'draft' ? 'Draft' : 'Published'}</span>
         </div>
         <div className="flex gap-3">
            {editingPost.status === 'published' && (
                <Button variant="ghost" onClick={handlePostToFacebook} isLoading={isPostingToFb} className="text-blue-400 hover:text-blue-300">
                    <Facebook className="w-4 h-4 mr-2" /> Share to Page
                </Button>
            )}
            <Button variant="secondary" onClick={() => setIsAiModalOpen(true)}>
               <Sparkles className="w-4 h-4 mr-2 text-purple-400" /> AI Assist
            </Button>
            <Button onClick={handleSaveCurrent}>
               <Save className="w-4 h-4 mr-2" /> Save & Close
            </Button>
         </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
         {/* Main Editor */}
         <div className="flex-1 bg-[#181818] rounded-xl border border-[#272727] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#272727]">
               <input 
                 type="text" 
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-600 border-none focus:ring-0 px-0"
                 placeholder="Article Title..."
               />
            </div>
            <div className="flex-1 relative">
               <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full bg-[#121212] text-slate-300 p-6 resize-none border-none focus:ring-0 font-mono text-sm leading-relaxed"
                  placeholder="<p>Write your story here...</p>"
               />
               <div className="absolute bottom-4 right-4 bg-[#222] text-xs text-slate-500 px-2 py-1 rounded border border-[#333]">
                  HTML / Markdown Supported
               </div>
            </div>
         </div>

         {/* Sidebar Metadata */}
         <div className="w-80 space-y-6 overflow-y-auto pr-1">
            <div className="bg-[#181818] rounded-xl border border-[#272727] p-5 space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Cover Image</label>
                  <div className="aspect-video bg-[#121212] rounded-lg border border-[#333] overflow-hidden relative group">
                     {coverImage ? (
                        <img src={coverImage} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-600" /></div>
                     )}
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Button size="sm" variant="secondary" onClick={async () => {
                           const p = prompt("Image Prompt:");
                           if (p) {
                              try { const url = await generateImage(p); setCoverImage(url); } catch(e) { alert("Failed"); }
                           }
                        }}>Change</Button>
                     </div>
                  </div>
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Linked Episode</label>
                  <select 
                     value={linkedEpisodeId}
                     onChange={(e) => setLinkedEpisodeId(e.target.value)}
                     className="w-full bg-[#121212] border border-[#333] rounded-lg text-sm text-slate-300 p-2 mb-2"
                  >
                     <option value="">-- None --</option>
                     {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                     ))}
                  </select>
                  {linkedEpisodeId && (
                     <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full text-xs"
                        onClick={handleGenerateFromEpisode}
                        isLoading={isGenerating}
                     >
                        <RefreshCw className="w-3 h-3 mr-2" /> Re-Generate from Episode
                     </Button>
                  )}
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Excerpt</label>
                  <textarea 
                     rows={3}
                     value={excerpt}
                     onChange={(e) => setExcerpt(e.target.value)}
                     className="w-full bg-[#121212] border border-[#333] rounded-lg text-sm text-slate-300 p-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                     placeholder="Short summary..."
                  />
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                     {tags.map(t => (
                        <span key={t} className="bg-[#222] border border-[#333] text-xs px-2 py-1 rounded flex items-center gap-1">
                           {t} <button onClick={() => removeTag(t)}><X className="w-3 h-3 hover:text-red-400" /></button>
                        </span>
                     ))}
                  </div>
                  <input 
                     value={tagInput}
                     onChange={(e) => setTagInput(e.target.value)}
                     onKeyDown={handleAddTag}
                     className="w-full bg-[#121212] border border-[#333] rounded-lg text-sm text-slate-300 p-2 focus:border-orange-500"
                     placeholder="Add tag and press Enter"
                  />
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                  <select 
                     value={editingPost.status} 
                     onChange={(e) => setEditingPost({...editingPost, status: e.target.value as any})}
                     className="w-full bg-[#121212] border border-[#333] rounded-lg text-sm text-slate-300 p-2"
                  >
                     <option value="draft">Draft</option>
                     <option value="published">Published</option>
                  </select>
               </div>
            </div>
         </div>
      </div>

      {/* AI Modal */}
      {isAiModalOpen && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] w-full max-w-lg rounded-2xl border border-[#333] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
               <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#1f1f1f]">
                  <h3 className="font-bold text-white flex items-center gap-2">
                     <Wand2 className="w-5 h-5 text-purple-500" /> AI Blog Generator
                  </h3>
                  <button onClick={() => setIsAiModalOpen(false)}><X className="text-slate-400" /></button>
               </div>
               
               <div className="p-6 space-y-6">
                  {/* Source Selector */}
                  <div className="flex p-1 bg-[#121212] rounded-lg border border-[#333]">
                     <button 
                        onClick={() => setAiSource('custom')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSource === 'custom' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                        Custom Topic
                     </button>
                     <button 
                        onClick={() => setAiSource('episode')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSource === 'episode' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                        From Episode
                     </button>
                  </div>

                  {aiSource === 'custom' ? (
                     <>
                        <div>
                           <label className="block text-sm font-medium text-slate-300 mb-1">Topic / Title Idea</label>
                           <input 
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-white focus:border-purple-500 focus:ring-purple-500"
                              placeholder="e.g. The benefits of AI in education"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-300 mb-1">Context / Notes</label>
                           <textarea 
                              value={aiContext}
                              onChange={(e) => setAiContext(e.target.value)}
                              rows={5}
                              className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-white focus:border-purple-500 focus:ring-purple-500 resize-none"
                              placeholder="Paste rough notes, key points, or a brief here..."
                           />
                        </div>
                     </>
                  ) : (
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-300 mb-1">Select Episode</label>
                           <select 
                              value={selectedEpisodeId}
                              onChange={(e) => setSelectedEpisodeId(e.target.value)}
                              className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-white focus:border-purple-500"
                           >
                              <option value="">-- Choose a Podcast Episode --</option>
                              {projects.map(p => (
                                 <option key={p.id} value={p.id}>{p.title}</option>
                              ))}
                           </select>
                        </div>
                        {selectedEpisodeId && (
                           <div className="bg-[#222] p-3 rounded-lg border border-[#333] text-sm text-slate-400">
                              <p><span className="text-white font-semibold">Selected:</span> {projects.find(p => p.id === selectedEpisodeId)?.title}</p>
                              <p className="mt-1">We will use the script content from this episode to generate a summarized blog post.</p>
                           </div>
                        )}
                     </div>
                  )}

                  <div className="pt-2">
                     <Button 
                        onClick={handleGenerateAI} 
                        isLoading={isGenerating} 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={aiSource === 'episode' && !selectedEpisodeId}
                     >
                        <Sparkles className="w-4 h-4 mr-2" /> Generate Full Post
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default BlogEditor;
