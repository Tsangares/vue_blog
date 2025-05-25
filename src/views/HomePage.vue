<template>
  <div class="home-page">
    <header class="blog-header">
      <h1>My Simple Blog</h1>
      <nav class="nav-links">
        <router-link v-if="!user" to="/login" class="nav-link">Login</router-link>
        <template v-else>
          <router-link to="/editor" class="nav-link">Write Post</router-link>
          <button @click="handleSignOut" class="nav-link sign-out-btn">Sign Out</button>
        </template>
      </nav>
    </header>

    <main class="blog-content">
      <div v-if="loading" class="loading">Loading posts...</div>
      
      <div v-else-if="posts.length === 0" class="empty-state">
        <h2>No posts yet</h2>
        <p>Check back later for new content!</p>
      </div>
      
      <article v-else v-for="post in posts" :key="post.id" class="blog-post">
        <h2 class="post-title">{{ post.title }}</h2>
        <div class="post-meta">
          <span class="post-date">{{ formatDate(post.created_at) }}</span>
        </div>
        <div class="post-content" v-html="post.content"></div>
      </article>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabaseService } from '../services/supabase'

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter()
    const user = ref(null)
    const posts = ref([])
    const loading = ref(true)
    const error = ref('')
    
    let authSubscription = null
    let realtimeSubscription = null

    const fetchPosts = async () => {
      loading.value = true
      error.value = ''

      try {
        const { data, error: fetchError } = await supabaseService.getPosts()
        
        if (fetchError) throw fetchError
        
        posts.value = data || []
      } catch (err) {
        error.value = 'Failed to load posts: ' + err.message
      } finally {
        loading.value = false
      }
    }

    const handleSignOut = async () => {
      const { error: signOutError } = await supabaseService.signOut()
      if (signOutError) {
        error.value = signOutError.message
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    onMounted(async () => {
      // Check current user
      const { data } = await supabaseService.getCurrentUser()
      user.value = data.user

      // Fetch posts
      await fetchPosts()

      // Set up real-time subscription
      realtimeSubscription = supabaseService.subscribeToPosts(() => {
        fetchPosts()
      })

      // Listen for auth changes
      authSubscription = supabaseService.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          user.value = session.user
        } else if (event === 'SIGNED_OUT') {
          user.value = null
        }
      })
    })

    onUnmounted(() => {
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe()
      }
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe()
      }
    })

    return {
      user,
      posts,
      loading,
      error,
      handleSignOut,
      formatDate
    }
  }
}
</script>

<style scoped>
.home-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.blog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.blog-header h1 {
  color: #1a202c;
  font-size: 2rem;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: #f7fafc;
  color: #2d3748;
}

.sign-out-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}

.loading {
  text-align: center;
  color: #718096;
  font-size: 1.1rem;
  margin: 3rem 0;
}

.empty-state {
  text-align: center;
  margin: 4rem 0;
  color: #718096;
}

.empty-state h2 {
  margin-bottom: 0.5rem;
}

.blog-post {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.blog-post:last-child {
  border-bottom: none;
}

.post-title {
  color: #1a202c;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.post-meta {
  margin-bottom: 1rem;
}

.post-date {
  color: #718096;
  font-size: 0.9rem;
}

.post-content {
  color: #2d3748;
  line-height: 1.6;
}

.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
  margin: 1.5rem 0 1rem 0;
  color: #1a202c;
}

.post-content :deep(p) {
  margin-bottom: 1rem;
}

.post-content :deep(ul),
.post-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.post-content :deep(blockquote) {
  border-left: 4px solid #e2e8f0;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #718096;
}

.error-message {
  background-color: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 2rem;
}
</style>