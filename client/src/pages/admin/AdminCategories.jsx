import AdminTaxonomyManager from '../../components/admin/AdminTaxonomyManager';
import {
  categoryMutations,
  useAdminCategories,
} from '../../hooks/useAdminBrandsCategories';

export default function AdminCategories() {
  return (
    <AdminTaxonomyManager
      title="Categories"
      entityLabel="Category"
      useData={useAdminCategories}
      mutations={categoryMutations}
      deactivateMessage={(name) => `Deactivating ${name} will hide all products in this category from customers. Are you sure?`}
    />
  );
}
