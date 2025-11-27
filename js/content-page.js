// NOT GOV.UK Juggle - Content Page (Get Started, Support)
const SPACE_ID = '580251rmw49s';
const DELIVERY_TOKEN = 'uy1OK3vdmQXP2YHWiQySRP2MDN04fbCiPR8WLB3g-7U';

const contentDiv = document.getElementById('content');

/**
 * Fetch content page by page type
 */
async function fetchContentPage() {
    // Get the page type from the global variable set in the HTML
    const pageType = window.BRUV_PAGE_TYPE || 'get-started';
    
    console.log('Fetching content page with type:', pageType);
    
    try {
        const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=contentPage&fields.pageType=${pageType}`;
        
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
        console.log('Content page data:', data);

        if (data.items && data.items.length > 0) {
            renderContentPage(data.items[0]);
        } else {
            showError(`No content page found with type: ${pageType}`);
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showError(`Unable to load content: ${err.message}`);
    }
}

/**
 * Render the content page
 */
function renderContentPage(page) {
    const fields = page.fields;
    
    let html = `
        <div class="bruv-back-link-container">
            <a href="index.html" class="bruv-back-link">Back to home</a>
        </div>
        
        <h1 class="bruv-heading-xl">${escapeHtml(fields.pageTitle)}</h1>
    `;

    if (fields.summary) {
        html += `<p class="bruv-body-l">${escapeHtml(fields.summary)}</p>`;
    }

    if (fields.bodyContent) {
        html += `<div class="bruv-body">${renderRichText(fields.bodyContent)}</div>`;
    }

    contentDiv.innerHTML = html;
}

/**
 * Render rich text content
 */
function renderRichText(richText) {
    if (!richText) return '';
    
    // Basic rich text rendering
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
                <p><strong>For content designers:</strong> Make sure you have created and published a Content Page entry in Contentful.</p>
            </div>
        </div>
    `;
}

// Load content when page loads
document.addEventListener('DOMContentLoaded', fetchContentPage);
