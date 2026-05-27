import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const router = express.Router();

// Setup DOMPurify for Node.js
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Helper to get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-read data (could be cached or read on request; reading on request for dynamic reflection if file changes)
const getProjectData = () => {
  try {
    const filePath = path.join(__dirname, '../data/projects.json');
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading projects.json:', error);
    throw new Error('Failed to load project data');
  }
};

/**
 * GET /api/projects
 * Serves the list of projects, ensuring all text fields are sanitized to prevent XSS.
 */
router.get('/', (req, res) => {
  try {
    const rawProjects = getProjectData();

    // Sanitize output
    const sanitizedProjects = rawProjects.map(project => ({
      ...project,
      title: DOMPurify.sanitize(project.title),
      shortDesc: DOMPurify.sanitize(project.shortDesc),
      fullDesc: DOMPurify.sanitize(project.fullDesc),
      // We also sanitize tags and coreSkills just in case
      tags: project.tags.map(tag => DOMPurify.sanitize(tag)),
      coreSkills: project.coreSkills ? project.coreSkills.map(skill => DOMPurify.sanitize(skill)) : [],
      // URLs shouldn't contain malicious payloads, but if there's a risk of javascript: URIs
      // we can sanitize or validate them. DOMPurify might strip valid iframe src or github links 
      // if used directly on URLs without care. Let's rely on React's attribute escaping for href/src, 
      // but ensure no javascript: is allowed.
      github: project.github && !project.github.toLowerCase().startsWith('javascript:') ? project.github : null,
      live: project.live && !project.live.toLowerCase().startsWith('javascript:') ? project.live : null,
      demo: project.demo && !project.demo.toLowerCase().startsWith('javascript:') ? project.demo : null,
    }));

    res.json({ success: true, data: sanitizedProjects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
