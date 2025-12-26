import type { Preview } from '@storybook/react-vite'
import '../src/index.scss'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#242424' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    a11y: {
      test: 'todo'
    }
  },
};

export default preview;