<!-- A simple icon component that uses inline SVG icons -->
<script>
    import icons from '../assets/icons.json';
    export let name = '', value='', color = 'currentColor', size = '24', strokeWidth = '1px',class_ = '';

    $: icon = value || icons[name] || '';
</script>

{#if icon}
    {#if icon.startsWith('<svg')}
      <span class="inline-block {class_}" style="width: {size}px; height: {size}px;" role="img" aria-hidden="true" >
        {@html icon}
      </span>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width={strokeWidth}  stroke-linecap="round" stroke-linejoin="round">
        <path d={icon} />
      </svg>
    {/if}
{/if}