'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/overview');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase sends a confirmation email by default unless disabled.
  return { success: 'Check your email to confirm your account' };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function updateProfile(formData: FormData) {
  const displayName = formData.get('displayName') as string;
  if (!displayName) return { error: 'Display name is required' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName }
  });

  if (error) return { error: error.message };
  return { success: 'Profile updated successfully' };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) return { error: 'Password must be at least 6 characters' };
  if (password !== confirmPassword) return { error: 'Passwords do not match' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };
  return { success: 'Password updated successfully' };
}

