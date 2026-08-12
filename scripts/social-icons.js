import getGraphqlHost from './graphql-host.js';

// social icons live in DAM (/content/dam/robinsonssupermarket/social_icons) rather than the
// code bundle. A plain /content/dam/... path only resolves on the AEM host itself — the
// published site is a different origin that doesn't proxy DAM paths at all, and even on the
// AEM host a raw DAM path 404s on the publish tier (assets there are only served through
// dynamic media) — so each icon is addressed by its dynamic-media delivery UUID instead.
const SOCIAL_ICON_DM_AID = {
  facebook: '3dba81d8-cea0-4c56-aba3-258f296e5d72',
  viber: '9fabc4a5-0642-4479-b649-fd5ed69d640e',
  twitter: '6ed1570e-f729-47f0-95ee-38767cc5e19d',
  youtube: 'b8ae7e1c-b4ca-4be8-9830-d1947b870d87',
  tiktok: '7596cf7f-6b54-4b02-908d-a3ca34c09b21',
  instagram: '8cc2cb57-b37c-4007-9cc1-9b1f9067e026',
};

/**
 * resolves the dynamic-media delivery URL for a social icon by name
 * @param {string} iconName one of the keys in SOCIAL_ICON_DM_AID (e.g. "facebook")
 * @returns {string|null} the icon's absolute URL, or null if the name isn't a social icon
 */
export default function getSocialIconUrl(iconName) {
  const dmAid = SOCIAL_ICON_DM_AID[iconName];
  if (!dmAid) return null;
  return `${getGraphqlHost()}/adobe/dynamicmedia/deliver/dm-aid--${dmAid}/${iconName}.svg`;
}
