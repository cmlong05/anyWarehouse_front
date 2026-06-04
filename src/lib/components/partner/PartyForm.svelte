<!-- 合作方表单 -->
<script lang="ts">
    import { FormInput, FormSelect } from '$lib/components/ui';
    import type { ZodSchema } from 'zod';
    import { onMount } from 'svelte';

    import type { Snippet } from 'svelte';

    interface PartyFormData {
        code: string;
        name: string;
        contact_name: string;
        phone: string;
        email: string;
        address: string;
        remark: string;
        is_active: boolean;
        [key: string]: unknown;
    }

    interface Props {
        onSubmit: (data: Record<string, unknown>) => void;
        onCancel: () => void;
        onDelete?: () => void;
        initialData?: Record<string, unknown>;
        schema: ZodSchema<unknown>;
        submitLabel?: string;
        deleteLabel?: string;
        loading?: boolean;
        showIsActive?: boolean;
        extras?: Snippet;
    }

    let {
        onSubmit,
        onCancel,
        onDelete,
        initialData = {},
        schema,
        submitLabel = '保存',
        deleteLabel = '删除',
        loading = false,
        showIsActive = true,
        extras
    }: Props = $props();

    let formData: PartyFormData = $state({
        code: '',
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        remark: '',
        is_active: true
    });
    let errors: Record<string, string> = $state({});

    function resetForm() {
        formData = {
            code: (initialData.code as string) || '',
            name: (initialData.name as string) || '',
            contact_name: (initialData.contact_name as string) || '',
            phone: (initialData.phone as string) || '',
            email: (initialData.email as string) || '',
            address: (initialData.address as string) || '',
            remark: (initialData.remark as string) || '',
            is_active: initialData.is_active !== undefined ? !!initialData.is_active : true
        };
    }

    onMount(resetForm);

    function validate(): boolean {
        errors = {};
        try {
            schema.parse(formData);
            return true;
        } catch (e) {
            if (e && typeof e === 'object' && 'issues' in e) {
                const issues = (e as { issues: { path: (string | number)[]; message: string }[] }).issues;
                for (const issue of issues) {
                    const path = issue.path[0] as string;
                    errors[path] = issue.message;
                }
            }
            return false;
        }
    }

    function handleSubmit(e: Event) {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    }
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-5">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
            label="编号"
            name="code"
            required
            value={formData.code}
            placeholder="请输入编号"
            error={errors.code}
            disabled={loading}
            oninput={(v) => formData.code = v}
        />
        <FormInput
            label="名称"
            name="name"
            required
            value={formData.name}
            placeholder="请输入名称"
            error={errors.name}
            disabled={loading}
            oninput={(v) => formData.name = v}
        />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
            label="联系人"
            name="contact_name"
            value={formData.contact_name || ''}
            placeholder="请输入联系人姓名"
            disabled={loading}
            oninput={(v) => formData.contact_name = v}
        />
        <FormInput
            label="联系电话"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            placeholder="请输入联系电话"
            disabled={loading}
            oninput={(v) => formData.phone = v}
        />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
            label="电子邮箱"
            name="email"
            type="email"
            value={formData.email || ''}
            placeholder="请输入电子邮箱"
            error={errors.email}
            disabled={loading}
            oninput={(v) => formData.email = v}
        />
        <FormInput
            label="地址"
            name="address"
            value={formData.address || ''}
            placeholder="请输入地址"
            disabled={loading}
            oninput={(v) => formData.address = v}
        />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
        {@render extras?.()}
    </div>

    {#if showIsActive}
    <div class="flex flex-row items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                bind:checked={formData.is_active}
                disabled={loading}
                class="w-5 h-5 cursor-pointer accent-blue-600"
            />
            <span class="text-gray-700">活跃状态</span>
        </label>
        <span class="text-gray-500 text-sm">取消勾选将禁用此条目</span>
    </div>
    {/if}

    <div class="flex flex-col gap-2">
        <label for="remark" class="font-medium text-gray-700 text-sm">备注</label>
        <textarea
            id="remark"
            rows="3"
            bind:value={formData.remark}
            placeholder="请输入备注（可选）"
            disabled={loading}
            class="px-3 py-2.5 border border-gray-300 rounded text-base 
                   transition-colors duration-150 w-full box-border resize-y
                   focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                   disabled:bg-gray-100 disabled:cursor-not-allowed"
        ></textarea>
        {#if errors.remark}
            <span class="text-red-600 text-sm mt-1">{errors.remark}</span>
        {/if}
    </div>

    <div class="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-gray-200">
        <div class="flex justify-start">
            {#if onDelete}
                <button
                    type="button"
                    class="px-6 py-2.5 rounded font-medium text-base cursor-pointer
                           transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed
                           bg-red-600 text-white hover:bg-red-700 hover:shadow-md
                           focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    onclick={onDelete}
                    disabled={loading}
                >
                    {deleteLabel}
                </button>
            {/if}
        </div>

        <div class="flex flex-col-reverse md:flex-row justify-end gap-4">
        <button 
            type="button" 
            class="px-6 py-2.5 rounded font-medium text-base cursor-pointer 
                   transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed
                   bg-gray-600 text-white hover:bg-gray-700 hover:shadow-md
                   focus:outline-none focus:ring-2 focus:ring-gray-500/50" 
            onclick={onCancel} 
            disabled={loading}
        >
            取消
        </button>
        <button 
            type="submit" 
            class="px-6 py-2.5 rounded font-medium text-base cursor-pointer 
                   transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed
                   bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md
                   focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            disabled={loading}
        >
            {loading ? '保存中...' : submitLabel}
        </button>
        </div>
    </div>
</form>
