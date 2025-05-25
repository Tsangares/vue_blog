<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isSignUp ? 'Create Account' : 'Sign In' }}</h2>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            minlength="6"
            :disabled="loading"
          />
        </div>
        
        <button type="submit" :disabled="loading" class="auth-button">
          {{ loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
        </button>
      </form>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="message" class="success-message">
        {{ message }}
      </div>
      
      <div class="auth-switch">
        <button @click="toggleMode" class="link-button" :disabled="loading">
          {{ isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { supabaseService } from '../services/supabase'

export default {
  name: 'AuthForm',
  emits: ['auth-success'],
  setup(props, { emit }) {
    const email = ref('')
    const password = ref('')
    const isSignUp = ref(false)
    const loading = ref(false)
    const error = ref('')
    const message = ref('')

    const toggleMode = () => {
      isSignUp.value = !isSignUp.value
      error.value = ''
      message.value = ''
    }

    const handleSubmit = async () => {
      loading.value = true
      error.value = ''
      message.value = ''

      try {
        if (isSignUp.value) {
          const { data, error: signUpError } = await supabaseService.signUp(
            email.value,
            password.value
          )
          
          if (signUpError) throw signUpError
          
          if (data.user && !data.session) {
            message.value = 'Check your email for confirmation link!'
          } else {
            emit('auth-success', data.user)
          }
        } else {
          const { data, error: signInError } = await supabaseService.signIn(
            email.value,
            password.value
          )
          
          if (signInError) throw signInError
          
          emit('auth-success', data.user)
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      isSignUp,
      loading,
      error,
      message,
      toggleMode,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.auth-card {
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.auth-button {
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auth-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.auth-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  background-color: #fef2f2;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  margin-top: 1rem;
}

.success-message {
  color: #059669;
  background-color: #f0fdf4;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  margin-top: 1rem;
}

.auth-switch {
  text-align: center;
  margin-top: 1.5rem;
}

.link-button {
  background: none;
  border: none;
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}

.link-button:hover:not(:disabled) {
  color: #2563eb;
}

.link-button:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}
</style>