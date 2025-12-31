<template>
  <div id="app">
    <h1>Element Plus Bundle Test (Full Bundle)</h1>
    <el-button type="primary" @click="count++">Count: {{ count }}</el-button>
    <el-input v-model="message" placeholder="Enter message"></el-input>
    <el-alert
      v-if="message"
      :title="`Hello: ${message}`"
      type="success"
      show-icon
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElAlert, ElButton, ElInput } from 'element-plus/es/index.mjs'

const count = ref(0)
const message = ref('')
</script>

<style></style>
