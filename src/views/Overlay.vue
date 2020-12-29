<template>
  <div class="overlay"></div>
</template>

<script>
export default {
  name: 'Overlay',
};
</script>

<style scoped>
.overlay{
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color:#000;
  opacity: .75;
  z-index: 9999999;
}
</style>
