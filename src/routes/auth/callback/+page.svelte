<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/client';

  onMount(async () => {
    const { data, error } = await supabase.auth.getSession();
    
    if (data.session) {
      goto('/');
    } else {
      goto('/');
    }
  });
</script>

<div class="flex items-center justify-center min-h-screen bg-zen-oat">
  <p class="text-zen-herb font-body">Signing you in...</p>
</div>
