import AdminTaxonomyManager from '../../components/admin/AdminTaxonomyManager';
import {
  brandMutations,
  useAdminBrands,
} from '../../hooks/useAdminBrandsCategories';

export default function AdminBrands() {
  return (
    <AdminTaxonomyManager
      title="Brands"
      entityLabel="Brand"
      useData={useAdminBrands}
      mutations={brandMutations}
      deactivateMessage={(name) => `Deactivating ${name} will hide all products of this brand from customers. Are you sure?`}
    />
  );
}
