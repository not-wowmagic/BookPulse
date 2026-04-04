/**
 * SEO Metadata Generator
 * Dynamically synthesizes OpenGraph metadata to act as "Cinematic Share Posters".
 * In a real Next.js/SSR environment, this would be computed server-side for scrapers.
 * Here, we mutate the DOM's <head> to update social previews.
 */
export function generateCinematicPoster(topBook) {
  if (!topBook) return;

  const { title, author, vibe, mentions } = topBook;
  
  // Cinematic phrase based on vibe
  let cinematicTagline = "The new obsession.";
  if (vibe === "Heartbreaking") cinematicTagline = "Prepare to be shattered.";
  if (vibe === "High-Stakes") cinematicTagline = "You won't be able to look away.";
  if (vibe === "Mind-Bending") cinematicTagline = "Everything you know is wrong.";
  if (vibe === "Wholesome") cinematicTagline = "A warm hug in book form.";
  if (vibe === "Gritty") cinematicTagline = "Dark, raw, and unputdownable.";

  const dynamicTitle = `${title} by ${author} | Trending #1 in PH`;
  const dynamicDesc = `${cinematicTagline} Currently tracking ${mentions.toLocaleString()} discussions across the Philippine book community.`;
  
  // To simulate a cinematic poster, we would ideally pass params to an OG Image Generation edge function (e.g. Vercel OG).
  // For this local mockup, we'll append query parameters to a placeholder generic image so it can be seen in logs.
  const dynamicOgImage = `https://bookpulse.ph/api/og?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&vibe=${encodeURIComponent(vibe || 'Trending')}`;

  // Update <title>
  document.title = dynamicTitle;

  // Update or Create Meta Tags
  const setMetaTag = (property, content) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  setMetaTag("og:title", dynamicTitle);
  setMetaTag("og:description", dynamicDesc);
  setMetaTag("og:image", dynamicOgImage);
  setMetaTag("twitter:card", "summary_large_image");
  setMetaTag("twitter:title", dynamicTitle);
  setMetaTag("twitter:description", dynamicDesc);
  setMetaTag("twitter:image", dynamicOgImage);
}
