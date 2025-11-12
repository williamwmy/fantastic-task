#!/usr/bin/env node

/**
 * Keep-Alive Script for Supabase Database
 *
 * This script performs a simple database operation to keep the Supabase
 * project active and prevent it from being paused due to inactivity.
 *
 * It's designed to run as a GitHub Action on a daily schedule.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  try {
    console.log('🏓 Pinging Supabase database...');
    console.log(`📍 URL: ${supabaseUrl}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);

    // Perform a simple query to keep the database active
    // Count families (this is a lightweight query that doesn't modify data)
    const { count, error } = await supabase
      .from('families')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error querying database:', error.message);
      process.exit(1);
    }

    console.log(`✅ Database is active! Found ${count} families.`);
    console.log('🎉 Keep-alive ping successful!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

keepAlive();
