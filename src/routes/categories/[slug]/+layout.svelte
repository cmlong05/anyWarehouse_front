<script>
	let { children, data } = $props();
</script>

<div class="layout">
	<main>
		{@render children()}
	</main>

	<aside>
		<h2>类目</h2>
		<ul>
			{#each data.categories as { id, name }}
				<li><a href={`/categories/${id}`}>{name}</a></li>
			{/each}
		</ul>
	</aside>
</div>

<style>
	@media (min-width: 640px) {
		.layout {
			display: grid;
			gap: 2em;
			grid-template-columns: 1fr 16em;
		}
	}
</style>