import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PodcastProject, BlogPost, CreatorProfile } from '../types';

interface StemGolfDB extends DBSchema {
  projects: {
    key: string;
    value: PodcastProject;
    indexes: { 'by-date': number };
  };
  posts: {
    key: string;
    value: BlogPost;
    indexes: { 'by-date': number };
  };
  settings: {
    key: string;
    value: CreatorProfile;
  };
}

const DB_NAME = 'stemgolf-cms-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<StemGolfDB>>;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<StemGolfDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Projects Store
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-date', 'createdAt');

        // Blog Posts Store
        const postStore = db.createObjectStore('posts', { keyPath: 'id' });
        postStore.createIndex('by-date', 'createdAt');

        // Settings/Profile Store
        db.createObjectStore('settings', { keyPath: 'slug' });
      },
    });
  }
  return dbPromise;
};

// Helper to process project audio persistence
const prepareProjectForSave = async (project: PodcastProject): Promise<PodcastProject> => {
  const p = { ...project };
  // If we have a blob URL but no blob, fetch it to store persistence
  if (p.audioUrl && p.audioUrl.startsWith('blob:') && !p.audioBlob) {
    try {
      const res = await fetch(p.audioUrl);
      const blob = await res.blob();
      p.audioBlob = blob;
    } catch (e) {
      console.warn("Failed to fetch audio blob for persistence", e);
    }
  }
  return p;
};

const restoreProject = (project: PodcastProject): PodcastProject => {
  const p = { ...project };
  // If we have a stored blob but the URL is likely invalid (session change), recreate it
  if (p.audioBlob) {
    p.audioUrl = URL.createObjectURL(p.audioBlob);
  }
  return p;
};

export const db = {
  projects: {
    list: async () => {
      const db = await initDB();
      const projects = await db.getAllFromIndex('projects', 'by-date');
      // Sort descending by date (newest first)
      return projects.reverse().map(restoreProject);
    },
    save: async (project: PodcastProject) => {
      const db = await initDB();
      const readyProject = await prepareProjectForSave(project);
      await db.put('projects', readyProject);
      return restoreProject(readyProject); // Return version with valid URL
    },
    delete: async (id: string) => {
      const db = await initDB();
      await db.delete('projects', id);
    },
    clear: async () => {
      const db = await initDB();
      await db.clear('projects');
    }
  },
  
  content: {
    list: async () => {
      const db = await initDB();
      const posts = await db.getAllFromIndex('posts', 'by-date');
      return posts.reverse();
    },
    save: async (post: BlogPost) => {
      const db = await initDB();
      await db.put('posts', post);
    },
    delete: async (id: string) => {
      const db = await initDB();
      await db.delete('posts', id);
    },
    clear: async () => {
      const db = await initDB();
      await db.clear('posts');
    }
  },

  users: {
    // We get the first profile found, or null
    getProfile: async () => {
      const db = await initDB();
      const all = await db.getAll('settings');
      return all.length > 0 ? all[0] : null;
    },
    saveProfile: async (profile: CreatorProfile) => {
      const db = await initDB();
      // Ensure we only keep one main profile for this single-user app
      await db.clear('settings'); 
      await db.put('settings', profile);
    },
    clear: async () => {
      const db = await initDB();
      await db.clear('settings');
    }
  }
};