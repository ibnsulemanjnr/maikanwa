# Maikanwa Clothing UI Components

Clean, modular UI components built with React, TypeScript, and Tailwind CSS.

## Color Scheme (Indigo + Gold)

- **Primary (Indigo)**: `#1E2A78`
- **Accent (Gold)**: `#F4B400`
- **Background**: `#FAFAFA`
- **Text**: `#111827`
- **Muted/Border**: `#E5E7EB`

## Component Structure

### Base UI Components (`/components/ui`)
- **Button** - Primary, secondary, outline, ghost, danger variants
- **Input** - Text input with label, error, and helper text
- **Select** - Dropdown with options
- **Textarea** - Multi-line text input
- **Checkbox** - Checkbox with label
- **Radio** - Radio button with label
- **Modal** - Dialog overlay with sizes
- **Spinner** - Loading indicator
- **Badge** - Status indicators
- **Alert** - Notification messages
- **Tabs** - Tabbed interface
- **Breadcrumb** - Navigation breadcrumbs
- **Pagination** - Page navigation
- **EmptyState** - Empty list placeholder
- **Card** - Content container with header, body, footer

### Store Components (`/components/store`)
- **Header** - Main navigation with cart and account
- **Footer** - Site footer with links
- **ProductCard** - Product display in grid
- **CategoryCard** - Category display with image
- **CartItem** - Cart item with quantity controls
- **SearchBar** - Product search
- **FilterSidebar** - Product filtering
- **MeasurementForm** - Tailoring measurements
- **OrderStatusBadge** - Order status indicator
- **TailoringStatusBadge** - Tailoring job status
- **QuantitySelector** - Quantity input with +/- buttons
- **PriceDisplay** - Formatted price with currency
- **OrderTimeline** - Order status timeline
- **AddressForm** - Address input form
- **ProductVariantSelector** - Size/color selection
- **ProductImageGallery** - Product image viewer

### Admin Components (`/components/admin`)
- **AdminSidebar** - Admin navigation menu
- **AdminHeader** - Admin top bar
- **StatsCard** - Dashboard metrics
- **DataTable** - Data table with columns
- **ImageUpload** - Multi-image uploader

### Providers (`/components/providers`)
- **ToastProvider** - Toast notifications (react-hot-toast)

## Usage Examples

### Button
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">Click me</Button>
<Button variant="outline" fullWidth>Full width</Button>
```

### Input
```tsx
import { Input } from '@/components/ui';

<Input 
  label="Email" 
  type="email" 
  error="Invalid email"
  helperText="We'll never share your email"
/>
```

### ProductCard
```tsx
import { ProductCard } from '@/components/store';

<ProductCard
  id="1"
  name="Ankara Fabric"
  slug="ankara-fabric"
  price={5000}
  image="/images/product.jpg"
  category="Fabrics"
  inStock={true}
  isNew={true}
/>
```

### Modal
```tsx
import { Modal, Button } from '@/components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <p>Are you sure?</p>
  <Button onClick={() => setIsOpen(false)}>Confirm</Button>
</Modal>
```

## Best Practices

1. **Import from index files** for cleaner imports:
   ```tsx
   import { Button, Input, Card } from '@/components/ui';
   ```

2. **Use cn() utility** for conditional classes:
   ```tsx
   import { cn } from '@/lib/utils';
   className={cn('base-class', condition && 'conditional-class')}
   ```

3. **Consistent spacing** - Use Tailwind spacing scale (4px increments)

4. **Mobile-first** - All components are responsive by default

5. **Accessibility** - Components include ARIA labels and keyboard navigation

## Styling Guidelines

- Use color variables from globals.css
- Maintain 8px border radius for consistency
- Use 2px focus ring with primary color
- Hover states should be subtle (opacity or background change)
- Disabled states use 60% opacity

## Component Composition

Components are designed to be composable:

```tsx
<Card>
  <CardHeader>
    <h2>Product Details</h2>
  </CardHeader>
  <CardBody>
    <ProductImageGallery images={images} alt="Product" />
    <PriceDisplay price={5000} originalPrice={7000} />
  </CardBody>
  <CardFooter>
    <Button fullWidth>Add to Cart</Button>
  </CardFooter>
</Card>
```
