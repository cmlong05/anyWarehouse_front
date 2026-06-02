# 分类下拉抽象说明

## 当前结构（文件分工）

- 关系搜索选项构建： [src/lib/utils/category-options.ts](../src/lib/utils/category-options.ts)
- 统一导出入口： [src/lib/utils/index.ts](../src/lib/utils/index.ts)

含义：
- buildCategoryRelationSearchOptions
  - 输入：分类数组
  - 输出：适配下拉的选项数组（value、label、searchText）
  - searchText 包含：自身、祖先、后代、同级名称

## 两处引用

### A. Item 编辑页（关系搜索 + 层级显示）

位置： [src/lib/components/ItemForm.svelte](../src/lib/components/ItemForm.svelte)


### B. 批量改分类弹窗

位置： [src/lib/components/BulkCategoryChangeModal.svelte](../src/lib/components/BulkCategoryChangeModal.svelte)

### C.CategoryForm 
anyWarehouse_front/src/lib/components/CategoryForm.svelte
