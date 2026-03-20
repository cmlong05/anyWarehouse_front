<script lang="ts">
  export let href: string | null = null;
  export let onClick: ((event: MouseEvent) => void) | null = null;
  export let action: 'edit' | 'add' | 'copy' | 'delete' | null = null;
  export let label: string | null = null;
  export let disabled = false;
  export let variant: 'default' | 'primary' | 'secondary' | 'danger' | null = null;
  export let icon: 'edit' | 'copy' | 'delete' | 'add' | null = null;

  const defaultLabels: Record<string, string> = {
    edit: '编辑',
    add: '添加',
    copy: '复制',
    delete: '删除',
  };

  const defaultIcons: Record<string, 'edit' | 'add' | 'copy' | 'delete'> = {
    edit: 'edit',
    add: 'add',
    copy: 'copy',
    delete: 'delete',
  };

  const actionVariant: Record<string, 'default' | 'primary' | 'secondary' | 'danger'> = {
    edit: 'secondary',
    add: 'primary',
    copy: 'default',
    delete: 'danger',
  };

  const computedAction = action || null;
  const computedIcon = (computedAction ? defaultIcons[computedAction] : icon) || 'edit';
  const computedLabel = label || (computedAction ? defaultLabels[computedAction] : (computedIcon ? defaultLabels[computedIcon] : '操作'));
  const computedVariant = variant || (computedAction ? actionVariant[computedAction] : 'default');

  const variantClasses: Record<string, string> = {
    default: 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700',
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
  };

  function getIconSvg() {
    if (!icon) return null;

    switch (icon) {
      case 'add':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`;
      case 'copy':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 12h8M8 17h8" />`;
      case 'delete':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-2h12l1 2M9 5h6" />`;
      case 'edit':
      default:
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />`;
    }
  }

  function handleClick(event: MouseEvent) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      event.preventDefault();
      onClick(event);
    }
  }
</script>

{#if href}
  <a
    href={href}
    class={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors border ${disabled ? 'opacity-50 cursor-not-allowed' : variantClasses[computedVariant] || variantClasses.default}`}
    aria-label={computedLabel}
    title={computedLabel}
    onclick={handleClick}
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      {#if computedIcon === 'add'}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      {:else if computedIcon === 'copy'}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 12h8M8 17h8" />
      {:else if computedIcon === 'delete'}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-2h12l1 2M9 5h6" />
      {:else}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      {/if}
    </svg>
    <span>{computedLabel}</span>
  </a>
{:else}
  <button
    type="button"
    disabled={disabled}
    class={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors border ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500 border-gray-300' : variantClasses[computedVariant] || variantClasses.default}`}
    onclick={handleClick}
    aria-label={computedLabel}
    title={computedLabel}
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      {#if computedIcon === 'add'}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      {:else if computedIcon === 'copy'}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 12h8M8 17h8" />
      {:else if computedIcon === 'delete'}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-2h12l1 2M9 5h6" />
      {:else}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      {/if}
    </svg>
    <span>{computedLabel}</span>
  </button>
{/if}
