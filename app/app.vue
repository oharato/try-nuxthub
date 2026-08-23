<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: "ja",
  },
  title: "CraftCommerce - モダン・クラフトストア",
  titleTemplate: "%s | CraftCommerce",
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    {
      name: "description",
      content:
        "全国の職人・クリエイターによるこだわりの手作り工芸品、木工家具、陶芸、レザーアイテム、商用フォントをお届けするモダンEコマースプラットフォーム。",
    },
    { property: "og:title", content: "CraftCommerce - モダン・クラフトストア" },
    {
      property: "og:description",
      content:
        "全国の職人・クリエイターによるこだわりの手作り工芸品、木工家具、陶芸、レザーアイテムのオンラインストア。",
    },
    { property: "og:type", content: "website" },
  ],
  link: [
    {
      rel: "icon",
      type: "image/svg+xml",
      href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏺</text></svg>",
    },
  ],
});
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator color="#0369a1" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
:root {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #0f172a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: #f8fafc;
}
</style>
