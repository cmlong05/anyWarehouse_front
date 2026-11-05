<!-- 原生日期输入框 -->
<script lang="ts">
	import FormField from './FormField.svelte';
	import { openNativeDatePicker } from '$lib/utils/dateInput';

	interface Props {
		label?: string;
		name?: string;
		id?: string;
		type?: 'date' | 'datetime-local';
		value?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		fullWidth?: boolean;
		min?: string;
		max?: string;
		oninput?: (value: string) => void;
		onchange?: (value: string) => void;
	}

	let {
		label,
		name,
		id = name,
		type = 'date',
		value = $bindable(''),
		required = false,
		disabled = false,
		error = '',
		fullWidth = false,
		min,
		max,
		oninput,
		onchange
	}: Props = $props();

	function handleInput(event: Event) {
		oninput?.((event.currentTarget as HTMLInputElement).value);
	}

	function handleChange(event: Event) {
		onchange?.((event.currentTarget as HTMLInputElement).value);
	}

	function handleClick(event: MouseEvent) {
		openNativeDatePicker(event.currentTarget as HTMLInputElement);
	}
</script>

{#snippet input()}
	<input
		{id}
		{name}
		{type}
		bind:value
		{required}
		{disabled}
		{min}
		{max}
		oninput={handleInput}
		onchange={handleChange}
		onclick={handleClick}
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
	/>
{/snippet}

{#if label}
	<FormField {label} for={id} {required} {error} {fullWidth}>
		{@render input()}
	</FormField>
{:else}
	{@render input()}
{/if}
