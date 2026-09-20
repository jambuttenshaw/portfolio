import markdownIt from "markdown-it";

const md = new markdownIt();

export default function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("resources");

  // Collections
  eleventyConfig.addCollection("projects", function(collectionApi) {
    return collectionApi.getFilteredByGlob("projects/*.md");
  });

  // Blog posts, newest first (requires a `date` field in the front matter)
  eleventyConfig.addCollection("blog", function(collectionApi) {
    return collectionApi
      .getFilteredByGlob("blog/*.md")
      .sort((a, b) => b.data.date - a.data.date);
  });

  // Set current year
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // Format a date as e.g. "15 July 2026"
  eleventyConfig.addFilter("formatDate", (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });

  // Format a date numerically as e.g. "15/07/2026" (DD/MM/YYYY)
  eleventyConfig.addFilter("formatDateNumeric", (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${d.getFullYear()}`;
  });

  // Markdown filter for inline markdown
  eleventyConfig.addNunjucksFilter("markdown", (str) => {
    if (!str) return '';
    return md.renderInline(str).trim();
  });

  // Add as a synchronous shortcode
  eleventyConfig.addNunjucksShortcode("markdownInline", (str) => {
    if (!str) return '';
    return md.renderInline(str).trim();
  });

  // Set template engines
  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};