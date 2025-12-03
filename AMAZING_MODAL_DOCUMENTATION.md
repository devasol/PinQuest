# Amazing Modal System

## Overview

Our new modal system provides a modern, responsive, and highly interactive solution for displaying messages, notifications, and confirmations in your application. It features:

- Beautiful animations powered by Framer Motion
- Multiple modal types (success, error, warning, info, loading)
- Responsive design that works on all devices
- Auto-close functionality with progress indicators
- Custom action buttons and advanced features
- Context API integration for easy usage throughout the app

## Features

### Modern Design
- Clean, contemporary UI with rounded corners and subtle shadows
- Elegant color schemes for different message types
- Proper spacing and typography for readability

### Smooth Animations
- Scale, slide, and fade animations
- Backdrop blur effects
- Staggered animations for content elements

### Multiple Modal Types
- **Success**: For successful operations
- **Error**: For error messages
- **Warning**: For warnings and important notices
- **Info**: For informational messages
- **Loading**: For ongoing operations
- **Confirmation**: For confirmation dialogs

### Responsive Design
- Adapts to all screen sizes (mobile, tablet, desktop)
- Proper sizing options (sm, md, lg, xl)
- Touch-friendly controls

### Advanced Features
- Auto-close with visual progress indicator
- Custom action buttons
- Keyboard navigation support
- Accessibility features

## Usage

### With Context API

```jsx
import { useModal } from '../contexts/ModalContext';

const MyComponent = () => {
  const { showModal } = useModal();

  const handleClick = () => {
    showModal({
      title: 'Success!',
      message: 'Operation completed successfully',
      type: 'success',
      confirmText: 'Great!',
      size: 'md',
      animationType: 'scale'
    });
  };

  return (
    <button onClick={handleClick}>Show Modal</button>
  );
};
```

### Direct Component Usage

```jsx
import EnhancedMessageModal from './EnhancedMessageModal';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Show Modal</button>
      
      <EnhancedMessageModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Custom Modal"
        message="This is a custom modal with actions"
        type="info"
        actions={[
          {
            text: "Action 1",
            onClick: () => console.log("Action 1 clicked"),
            buttonColor: "bg-blue-500 hover:bg-blue-600 text-white"
          }
        ]}
      />
    </div>
  );
};
```

## Props

### Modal Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | boolean | false | Controls modal visibility |
| onClose | function | - | Function called when modal closes |
| title | string | - | Modal title |
| message | string | - | Modal message content |
| type | string | 'default' | Modal type: 'success', 'error', 'warning', 'info', 'loading' |
| onConfirm | function | - | Function called when confirm button is clicked |
| confirmText | string | 'OK' | Text for confirm button |
| cancelText | string | 'Cancel' | Text for cancel button |
| showCloseButton | boolean | true | Show close button |
| showConfirmButton | boolean | true | Show confirm button |
| showCancelButton | boolean | false | Show cancel button |
| showIcon | boolean | true | Show type-specific icon |
| autoClose | number | 0 | Auto-close time in milliseconds (0 for disabled) |
| size | string | 'md' | Size: 'sm', 'md', 'lg', 'xl' |
| variant | string | 'solid' | Style variant: 'solid', 'outline', 'elevated' |
| animationType | string | 'scale' | Animation: 'scale', 'slide', 'fade' |

## Integration

The new modal system is fully integrated with the existing `ModalContext` and can be used throughout the application without any breaking changes.