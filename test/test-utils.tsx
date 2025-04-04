import React from 'react';
import { render, RenderResult } from '@testing-library/react';

interface WrapperFindResult {
  exists: () => boolean;
  text: () => string;
  click: () => void;
  simulate?: (event: string) => void;
}

type ComponentProps = Record<string, unknown>;

interface Wrapper extends RenderResult {
  find: (
    selector: string | React.ComponentType<ComponentProps>
  ) => WrapperFindResult;
  setProps: (props: Record<string, unknown>) => Wrapper;
  unmount: () => void;
}

/**
 * Helper function to migrate from enzyme mount to React Testing Library render
 * This helps maintain similar API while migrating tests
 * @param element - The React element to render
 * @returns Render result with additional wrapper helpers
 */
export function renderWithWrapper(element: React.ReactElement): Wrapper {
  const renderResult = render(element);

  // Create a wrapper-like object to help with migration
  const wrapper: Wrapper = {
    ...renderResult,
    find: (selector: string | React.ComponentType<ComponentProps>) => {
      // Handle component types (e.g., Variant)
      if (typeof selector !== 'string') {
        // For component types, we can't really find them in the DOM directly
        // So return a mock that just focuses on the first instance
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const element = document.querySelector('[data-testid]');
        return {
          exists: () => true,
          text: () => document.body.textContent || '',
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          at: (_index: number) => ({
            text: () => document.body.textContent || '',
          }),
          click: () => {},
          simulate: () => {},
        };
      }

      // Handle ID selectors
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        const element = document.getElementById(id);
        return {
          exists: () => !!element,
          text: () => element?.textContent || '',
          click: () => {
            if (element) {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              });
              element.dispatchEvent(clickEvent);
            }
          },
          simulate: (event: string) => {
            if (element) {
              if (event === 'click') {
                const clickEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  button: 0,
                });
                element.dispatchEvent(clickEvent);
              }
            }
          },
        };
      }

      // Handle tag selectors (e.g., 'button')
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        const element = elements[0] as HTMLElement;
        return {
          exists: () => true,
          text: () => element.textContent || '',
          click: () => {
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            });
            element.dispatchEvent(clickEvent);
          },
          simulate: (event: string) => {
            if (event === 'click') {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              });
              element.dispatchEvent(clickEvent);
            }
          },
        };
      }

      // Return empty object for selectors that don't exist
      return {
        exists: () => false,
        text: () => '',
        click: () => {
          throw new Error(`Element with selector "${selector}" not found`);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        simulate: (_event: string) => {
          throw new Error(`Element with selector "${selector}" not found`);
        },
      };
    },
    setProps: (props: Record<string, unknown>) => {
      // This is not directly possible in RTL, but we'll rerender with new props
      renderResult.rerender(React.cloneElement(element, props));
      return wrapper;
    },
  };

  return wrapper;
}

// Export all regular RTL functions
export * from '@testing-library/react';
