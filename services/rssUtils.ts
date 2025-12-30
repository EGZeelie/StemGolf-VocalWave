import { PodcastProject } from "../types";

export const generateRSSFeed = (project: PodcastProject, audioSize: number = 0): string => {
  const now = new Date().toUTCString();
  const pubDate = project.metadata.publishDate 
    ? new Date(project.metadata.publishDate).toUTCString() 
    : now;

  // We assume a placeholder public URL for the purpose of the RSS generation 
  // since this is a client-side app. In a real app, this would be the CDN URL.
  const publicAudioUrl = `https://stemgolf-host.com/audio/${project.id}.wav`;
  const publicCoverUrl = project.metadata.coverArt || 'https://stemgolf-host.com/default-cover.jpg';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${escapeXml(project.title)}</title>
    <description>${escapeXml(project.description)}</description>
    <link>https://stemgolf.app</link>
    <language>af</language>
    <copyright>Copyright ${new Date().getFullYear()} ${escapeXml(project.metadata.author)}</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${pubDate}</pubDate>
    <itunes:author>${escapeXml(project.metadata.author)}</itunes:author>
    <itunes:type>${project.metadata.type}</itunes:type>
    <itunes:owner>
      <itunes:name>${escapeXml(project.metadata.author)}</itunes:name>
      <itunes:email>hello@stemgolf.app</itunes:email>
    </itunes:owner>
    <itunes:image href="${publicCoverUrl}"/>
    <itunes:category text="${escapeXml(project.metadata.genre)}"/>
    <itunes:explicit>${project.metadata.explicit ? 'true' : 'false'}</itunes:explicit>
    
    <item>
      <title>${escapeXml(project.title)}</title>
      <description>${escapeXml(project.description)}</description>
      <link>https://stemgolf.app/episode/${project.id}</link>
      <enclosure url="${publicAudioUrl}" length="${audioSize}" type="audio/wav"/>
      <guid isPermaLink="false">${project.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <itunes:duration>${Math.round(project.duration || 0)}</itunes:duration>
      <itunes:season>${project.metadata.season}</itunes:season>
      <itunes:episode>${project.metadata.episode}</itunes:episode>
      <itunes:episodeType>${project.metadata.type}</itunes:episodeType>
      <itunes:explicit>${project.metadata.explicit ? 'true' : 'false'}</itunes:explicit>
    </item>
  </channel>
</rss>`;

  return xml;
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

export const downloadRSS = (xmlContent: string, filename: string) => {
  const blob = new Blob([xmlContent], { type: 'application/rss+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
