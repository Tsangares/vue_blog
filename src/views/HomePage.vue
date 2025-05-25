<!-- src/views/HomePage.vue -->
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
      
      <div v-else class="blog-layout">
        <!-- Blog Index Sidebar -->
        <aside class="blog-index">
          <h3>Blog Posts</h3>
          <div class="index-list">
            <a 
              v-for="(post, index) in posts" 
              :key="post.id"
              :href="`#post-${post.id}`"
              class="index-item"
              @click="scrollToPost(post.id)"
            >
              <span class="post-number">{{ index + 1 }}.</span>
              <div class="index-details">
                <span class="index-title">{{ truncateTitle(post.title) }}</span>
                <span class="index-date">{{ formatShortDate(post.created_at) }}</span>
              </div>
            </a>
          </div>
        </aside>

        <!-- Blog Posts Content -->
        <div class="blog-posts">
          <article 
            v-for="(post, index) in posts" 
            :key="post.id" 
            :id="`post-${post.id}`"
            class="blog-post"
          >
            <div class="post-header">
              <div class="post-meta-top">
                <span class="post-number-badge">Post #{{ index + 1 }}</span>
                <span class="post-date-badge">{{ formatFullDate(post.created_at) }}</span>
              </div>
              <h2 class="post-title">{{ post.title }}</h2>
              <div class="post-meta">
                <span class="post-time">{{ formatRelativeTime(post.created_at) }}</span>
                <span class="reading-time">{{ estimateReadingTime(post.content) }} min read</span>
              </div>
            </div>
            <div class="post-content" v-html="post.content"></div>
            <div class="post-footer">
              <small class="post-id">ID: {{ post.id }}</small>
            </div>
          </article>
        </div>
      </div>

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
        
        // Sort posts chronologically (oldest first)
        posts.value = (data || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
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

    const formatFullDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatShortDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      })
    }

    const formatRelativeTime = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Just now'
      if (diffInHours < 24) return `${diffInHours}h ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays < 7) return `${diffInDays} days ago`
      
      const diffInWeeks = Math.floor(diffInDays / 7)
      if (diffInWeeks === 1) return '1 week ago'
      if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
      
      return formatFullDate(dateString)
    }

    const estimateReadingTime = (content) => {
      // Remove HTML tags and count words
      const text = content.replace(/<[^>]*>/g, '')
      const wordCount = text.split(/\s+/).length
      const readingTime = Math.ceil(wordCount / 200) // Average 200 words per minute
      return readingTime > 0 ? readingTime : 1
    }

    const truncateTitle = (title) => {
      return title.length > 35 ? title.substring(0, 35) + '...' : title
    }

    const scrollToPost = (postId) => {
      setTimeout(() => {
        const element = document.getElementById(`post-${postId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
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
      formatFullDate,
      formatShortDate,
      formatRelativeTime,
      estimateReadingTime,
      truncateTitle,
      scrollToPost
    }
  }
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
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

.blog-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
  align-items: start;
}

.blog-index {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
  max-height: 80vh;
  overflow-y: auto;
}

.blog-index h3 {
  color: #1a202c;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.index-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.index-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  color: #4a5568;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.index-item:hover {
  background-color: white;
  border-color: #cbd5e0;
  color: #2d3748;
}

.post-number {
  font-weight: 600;
  color: #3182ce;
  min-width: 1.5rem;
}

.index-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.index-title {
  font-weight: 500;
  font-size: 0.9rem;
  line-height: 1.3;
}

.index-date {
  font-size: 0.8rem;
  color: #718096;
}

.blog-posts {
  min-width: 0; /* Prevents flex overflow */
}

.blog-post {
  margin-bottom: 4rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  scroll-margin-top: 2rem;
}

.blog-post:last-child {
  border-bottom: none;
}

.post-header {
  margin-bottom: 1.5rem;
}

.post-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.post-number-badge {
  background: #3182ce;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.post-date-badge {
  background: #edf2f7;
  color: #4a5568;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.post-title {
  color: #1a202c;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.post-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.post-time {
  color: #718096;
  font-size: 0.9rem;
}

.reading-time {
  color: #a0aec0;
  font-size: 0.9rem;
}

.post-content {
  color: #2d3748;
  line-height: 1.6;
  margin-bottom: 1rem;
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

.post-footer {
  text-align: right;
  padding-top: 1rem;
  border-top: 1px solid #f7fafc;
}

.post-id {
  color: #a0aec0;
  font-size: 0.8rem;
}

.error-message {
  background-color: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .blog-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .blog-index {
    position: static;
    max-height: none;
    order: 2;
  }
  
  .post-meta-top {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .post-title {
    font-size: 1.5rem;
  }
}
</style>