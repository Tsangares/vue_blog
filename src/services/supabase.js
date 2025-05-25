import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://vjccyqkiucbokahiwlvw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2N5cWtpdWNib2thaGl3bHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNTgwMzIsImV4cCI6MjA2MzczNDAzMn0.VDdATiavgzqzQbVXeN5u2Q1Dh5_uNvqj-orKzMPAhu8'

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