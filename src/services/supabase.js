import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-public-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseService = {
  // Authentication (login only)
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser() {
    return supabase.auth.getUser()
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Blog posts operations
  async getPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async createPost(post) {
    const { data: userData } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        title: post.title,
        content: post.content,
        author_id: userData.user?.id,
        published: true
      }])
      .select()
    
    return { data, error }
  },

  // Real-time subscription for posts
  subscribeToPosts(callback) {
    return supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        callback
      )
      .subscribe()
  }
}