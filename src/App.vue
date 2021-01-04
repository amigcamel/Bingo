<template>
  <div id="app">
    <router-view/>
    <div class="footer">
      <div class="container text-center">
        &copy; Copyright {{new Date().getFullYear()}},
        <a href="https://aji.tw" target="_blank">Owen Liu</a>. All Rights Reserved
      </div>
    </div>
  </div>

</template>
