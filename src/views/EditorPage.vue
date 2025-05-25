<template>
  <div class="editor-page">
    <header class="editor-header">
      <h1>Write New Post</h1>
      <div class="header-actions">
        <router-link to="/" class="back-link">← Back to Blog</router-link>
        <button @click="handleSignOut" class="sign-out-btn">Sign Out</button>
      </div>
    </header>

    <div class="editor-container">
      <form @submit.prevent="publishPost" class="post-form">
        <div class="form-group">
          <label for="title">Post Title</label>
          <input
            id="title"
            v-model="title"
            type="text"
            placeholder="Enter your post title..."
            required
            :disabled="loading"
            class="title-input"
          />
        </div>

        <div class="form-group">
          <label>Post Content</label>
          <QuillEditor
            v-model:content="content"
            content-type="html"
            placeholder="Write your blog post here..."
            :options="editorOptions"
            class="editor"
          />
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="loading || !title.trim()" class="publish-button">
            {{ loading ? 'Publishing...' : 'Publish Post' }}
          </button>
        </div>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        Post published successfully! 
        <router-link to="/">View on homepage</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { supabaseService } from '../services/supabase'

export default {
  name: 'EditorPage',
  components: {
    QuillEditor
  },
  setup() {
    const router = useRouter()
    const title = ref('')
    const content = ref('')
    const loading = ref(false)
    const error = ref('')
    const success = ref(false)

    const editorOptions = {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'header': 1 }, { 'header': 2 }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'script': 'sub'}, { 'script': 'super' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          ['link', 'image'],
          ['clean']
        ]
      },
      placeholder: 'Write your blog post here...'
    }

    const handleSignOut = async () => {
      const { error: signOutError } = await supabaseService.signOut()
      if (!signOutError) {
        router.push('/')
      }
    }

    const publishPost = async () => {
      loading.value = true
      error.value = ''
      success.value = false

      try {
        const { data, error: publishError } = await supabaseService.createPost({
          title: title.value,
          content: content.value
        })
        
        if (publishError) throw publishError
        
        success.value = true
        title.value = ''
        content.value = ''
      } catch (err) {
        error.value = 'Failed to publish post: ' + err.message
      } finally {
        loading.value = false
      }
    }

    return {
      title,
      content,
      loading,
      error,
      success,
      editorOptions,
      handleSignOut,
      publishPost
    }
  }
}
</script>

<style scoped>
.editor-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.editor-header h1 {
  color: #1a202c;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.back-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.sign-out-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.sign-out-btn:hover {
  background: #dc2626;
}

.editor-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.title-input {
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
}

.title-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.title-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.editor {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  min-height: 400px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.publish-button {
  padding: 0.75rem 2rem;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.publish-button:hover:not(:disabled) {
  background-color: #047857;
}

.publish-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  background-color: #fef2f2;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  margin-top: 1rem;
}

.success-message {
  color: #059669;
  background-color: #f0fdf4;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  margin-top: 1rem;
}

.success-message a {
  color: #047857;
  font-weight: 600;
}
</style>