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

    // Insert a heartbeat record to ensure database activity is registered
    // This is a write operation that Supabase will definitely track
    const { data: pingData, error: pingError } = await supabase
      .from('keep_alive_pings')
      .insert([
        {
          source: 'github-actions',
          pinged_at: new Date().toISOString()
        }
      ])
      .select();

    if (pingError) {
      console.error('❌ Error writing heartbeat:', pingError.message);
      process.exit(1);
    }

    console.log(`✅ Heartbeat written successfully! ID: ${pingData[0]?.id}`);

    // Also perform a read to verify database connectivity
    const { count, error: countError } = await supabase
      .from('families')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error reading database:', countError.message);
      process.exit(1);
    }

    console.log(`✅ Database is active! Found ${count} families.`);

    // Clean up old pings (keep last 100 records)
    const { error: cleanupError } = await supabase
      .from('keep_alive_pings')
      .delete()
      .lt('pinged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (cleanupError) {
      console.warn('⚠️  Warning: Could not cleanup old pings:', cleanupError.message);
      // Don't fail the script for cleanup errors
    } else {
      console.log('🧹 Cleaned up pings older than 30 days');
    }

    console.log('🎉 Keep-alive ping successful!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

keepAlive();
