async function loadPortfolio() {
  const response = await fetch('/api/content');
  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || 'Failed to load');
  }

  return data.content;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value || '';
  }
}

function setLink(id, href, label) {
  const node = document.getElementById(id);
  if (node) {
    node.href = href || '#';
    if (label) {
      node.textContent = label;
    }
  }
}

(async function init() {
  try {
    const { profile } = await loadPortfolio();
    document.title = `Contact | ${profile.name}`;

    setText('contactBio', profile.bio);
    setText('emailValue', profile.email);
    setText('phoneValue', profile.phone || 'Not provided');
    setText('locationValue', profile.location || 'Not provided');

    const emailHref = profile.email ? `mailto:${profile.email}` : '#';
    setLink('directEmail', emailHref, profile.email ? `Email ${profile.name}` : 'Email');
    setLink('directCta', profile.ctaLink, profile.ctaLabel || 'Primary CTA');
  } catch (error) {
    console.error(error);
  }
})();
