// BRUV.UK Juggle - Guides Page
const SPACE_ID = '580251rmw49s';
const DELIVERY_TOKEN = 'uy1OK3vdmQXP2YHWiQySRP2MDN04fbCiPR8WLB3g-7U';

const contentDiv = document.getElementById('content');

/**
 * Get slug from URL parameter
 */
function getSlugFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('slug');
}

/**
 * Fetch guides from Contentful
 */
async function fetchGuides() {
    const slug = getSlugFromUrl();
    
    if (slug) {
        // If there's a slug in the URL, fetch and show that specific guide
        await fetchSingleGuide(slug);
    } else {
        // Otherwise, show all guides
        await fetchAllGuides();
    }
}

/**
 * Fetch all guides for list view
 */
async function fetchAllGuides() {
    console.log('Fetching all guides from Contentful...');
    
    try {
        const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=guide`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${DELIVERY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Guides data:', data);

        if (data.items && data.items.length > 0) {
            renderGuidesList(data.items);
        } else {
            showError('No guides found. Please create Guide entries in Contentful.');
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showError(`Unable to load guides: ${err.message}`);
    }
}

/**
 * Fetch a single guide by slug
 */
async function fetchSingleGuide(slug) {
    console.log('Fetching guide with slug:', slug);
    
    try {
        // Fetch the guide by slug, including guide sections (depth 2)
        const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=guide&fields.slug=${slug}&include=2`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${DELIVERY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Single guide data:', data);

        if (data.items && data.items.length > 0) {
            const guide = data.items[0];
            const sections = extractGuideSections(data, guide);
            renderSingleGuide(guide, sections);
        } else {
            showError(`Guide not found with slug: ${slug}`);
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showError(`Unable to load guide: ${err.message}`);
    }
}

/**
 * Extract guide sections from included entries
 */
function extractGuideSections(data, guide) {
    if (!guide.fields.guideSections || !data.includes?.Entry) {
        return [];
    }

    const sections = guide.fields.guideSections
        .map(sectionRef => {
            const sectionId = sectionRef.sys.id;
            return data.includes.Entry.find(entry => entry.sys.id === sectionId);
        })
        .filter(section => section && section.fields);

    // Sort by order field if it exists
    sections.sort((a, b) => {
        const orderA = a.fields.order || 0;
        const orderB = b.fields.order || 0;
        return orderA - orderB;
    });

    return sections;
}

/**
 * Render list of all guides
 */
function renderGuidesList(guides) {
    let html = `
        <div class="bruv-back-link-container">
            <a href="index.html" class="bruv-back-link">Back to home</a>
        </div>
        
        <h1 class="bruv-heading-xl">Guides</h1>
        <p class="bruv-body-l">Step-by-step guides to help you use BRUV.UK Juggle.</p>
        
        <hr class="bruv-section-break bruv-section-break--visible bruv-section-break--xl">
    `;

    guides.forEach(guide => {
        const guideUrl = `guides.html?slug=${guide.fields.slug}`;
        
        html += `
            <div style="margin-bottom: 50px;">
                <h2 class="bruv-heading-l" style="margin-bottom: 15px;">
                    <a href="${escapeHtml(guideUrl)}" class="bruv-link">${escapeHtml(guide.fields.title)}</a>
                </h2>
                ${guide.fields.summary ? `<p class="bruv-body">${escapeHtml(guide.fields.summary)}</p>` : ''}
            </div>
        `;
    });

    html += `
        <div class="bruv-inset-text">
            <p><strong>For content designers:</strong> Create Guide entries in Contentful and link them to Guide Sections to build comprehensive guides.</p>
        </div>
    `;

    contentDiv.innerHTML = html;
}

/**
 * Render a single guide with its sections
 */
function renderSingleGuide(guide, sections) {
    const fields = guide.fields;
    
    let html = `
        <div class="bruv-back-link-container">
            <a href="guides.html" class="bruv-back-link">Back to all guides</a>
        </div>
        
        <h1 class="bruv-heading-xl">${escapeHtml(fields.title)}</h1>
    `;

    if (fields.summary) {
        html += `<p class="bruv-body-l">${escapeHtml(fields.summary)}</p>`;
    }

    if (fields.lastUpdated) {
        const date = new Date(fields.lastUpdated);
        const formattedDate = date.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        html += `<p class="bruv-body-s" style="color: #505a5f;">Last updated: ${formattedDate}</p>`;
    }

    // Table of contents if there are multiple sections
    if (sections.length > 1) {
        html += `
            <div class="bruv-guide-nav">
                <h2 class="bruv-guide-nav__heading">Contents</h2>
                <ul class="bruv-guide-nav__list">
        `;
        
        sections.forEach((section, index) => {
            html += `
                <li class="bruv-guide-nav__item">
                    <a href="#section-${index}" class="bruv-guide-nav__link">${escapeHtml(section.fields.sectionTitle)}</a>
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
        `;
    }

    // Render sections
    sections.forEach((section, index) => {
        html += `
            <div id="section-${index}" style="margin-top: 40px;">
                <h2 class="bruv-heading-l">${escapeHtml(section.fields.sectionTitle)}</h2>
                <div class="bruv-body">
                    ${renderRichText(section.fields.content)}
                </div>
            </div>
        `;
    });

    // If no sections
    if (sections.length === 0) {
        html += `
            <div class="bruv-inset-text" style="margin-top: 40px;">
                <p><strong>This guide doesn't have any sections yet.</strong></p>
                <p>Add Guide Section entries in Contentful and link them to this guide.</p>
            </div>
        `;
    }

    contentDiv.innerHTML = html;
}

/**
 * Render rich text content
 */
function renderRichText(richText) {
    if (!richText) return '';
    
    // Basic rich text rendering
    // Contentful rich text is in a structured format
    if (richText.content && Array.isArray(richText.content)) {
        return richText.content.map(node => renderNode(node)).join('');
    }
    
    // Fallback for plain text
    return escapeHtml(String(richText));
}

/**
 * Render a rich text node
 */
function renderNode(node) {
    if (!node) return '';
    
    switch (node.nodeType) {
        case 'paragraph':
            return `<p>${renderContent(node.content)}</p>`;
        
        case 'heading-1':
            return `<h1 class="bruv-heading-xl">${renderContent(node.content)}</h1>`;
        
        case 'heading-2':
            return `<h2 class="bruv-heading-l">${renderContent(node.content)}</h2>`;
        
        case 'heading-3':
            return `<h3 class="bruv-heading-m">${renderContent(node.content)}</h3>`;
        
        case 'heading-4':
            return `<h4 class="bruv-heading-s">${renderContent(node.content)}</h4>`;
        
        case 'unordered-list':
            return `<ul class="bruv-list bruv-list--bullet">${renderContent(node.content)}</ul>`;
        
        case 'ordered-list':
            return `<ol class="bruv-list bruv-list--number">${renderContent(node.content)}</ol>`;
        
        case 'list-item':
            return `<li>${renderContent(node.content)}</li>`;
        
        case 'hr':
            return `<hr class="bruv-section-break bruv-section-break--visible">`;
        
        case 'blockquote':
            return `<div class="bruv-inset-text">${renderContent(node.content)}</div>`;
        
        case 'hyperlink':
            const url = node.data?.uri || '#';
            return `<a href="${escapeHtml(url)}" class="bruv-link">${renderContent(node.content)}</a>`;
        
        case 'text':
            let text = escapeHtml(node.value || '');
            
            // Apply marks (bold, italic, etc.)
            if (node.marks && node.marks.length > 0) {
                node.marks.forEach(mark => {
                    if (mark.type === 'bold') {
                        text = `<strong>${text}</strong>`;
                    } else if (mark.type === 'italic') {
                        text = `<em>${text}</em>`;
                    } else if (mark.type === 'underline') {
                        text = `<u>${text}</u>`;
                    } else if (mark.type === 'code') {
                        text = `<code>${text}</code>`;
                    }
                });
            }
            
            return text;
        
        default:
            // For unknown node types, try to render content if it exists
            if (node.content) {
                return renderContent(node.content);
            }
            return '';
    }
}

/**
 * Render content array
 */
function renderContent(content) {
    if (!content || !Array.isArray(content)) return '';
    return content.map(node => renderNode(node)).join('');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show error message
 */
function showError(message) {
    contentDiv.innerHTML = `
        <div class="bruv-error-box">
            <h2>Error loading content</h2>
            <p class="bruv-body">${escapeHtml(message)}</p>
            <div class="bruv-inset-text">
                <p><strong>For content designers:</strong> Make sure you have created and published Guide entries in Contentful.</p>
            </div>
        </div>
    `;
}

// Load content when page loads
document.addEventListener('DOMContentLoaded', fetchGuides);
