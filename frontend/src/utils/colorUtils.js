// src/utils/colorUtils.js
export function getGroupColor(uri = '') {
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      hash = uri.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 60%)`;
  }
  