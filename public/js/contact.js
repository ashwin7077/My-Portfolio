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

function setBrand(profile = {}) {
  const textNode = document.getElementById('brandLogoText');
  const imageNode = document.getElementById('brandLogoImage');

  const logoText = String(profile.logoText || profile.name || 'AP').trim().slice(0, 2).toUpperCase();
  if (textNode) {
    textNode.textContent = logoText || 'AP';
  }

  if (!imageNode) return;
  const logoUrl = String(profile.logoImageUrl || '').trim();
  if (logoUrl) {
    imageNode.src = logoUrl;
    imageNode.classList.add('visible');
    if (textNode) textNode.classList.add('hidden');
    return;
  }

  imageNode.classList.remove('visible');
  imageNode.removeAttribute('src');
  if (textNode) textNode.classList.remove('hidden');
}

(async function init() {
  try {
    const { profile } = await loadPortfolio();
    document.title = `Contact | ${profile.name}`;
    setBrand(profile);

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
