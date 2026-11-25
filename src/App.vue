<template>
  <a-config-provider :theme="theme">
    <RouterView />
  </a-config-provider>
</template>

<script setup>
// UI theme only: brand colour + rounded, smooth controls.
const theme = {
  token: {
    colorPrimary: "#1d3c78",
    colorLink: "#1d3c78",
    borderRadius: 8,
    controlHeight: 34,
    motionDurationMid: "0.2s",
    // Form fields: clearer borders, placeholders and focus ring
    colorBorder: "#b9c3d3",
    colorTextPlaceholder: "#6b778c",
    controlOutline: "rgba(29, 60, 120, 0.15)",
    controlOutlineWidth: 3,
  },
};
</script>
