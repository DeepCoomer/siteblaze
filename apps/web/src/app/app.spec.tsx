import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('shows a loading state before the config is fetched', () => {
    const { getByText } = render(<App />);
    expect(getByText(/loading config/i)).toBeTruthy();
  });
});
