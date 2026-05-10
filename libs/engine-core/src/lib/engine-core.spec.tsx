import { render } from '@testing-library/react';

import OrgEngineCore from './engine-core';

describe('OrgEngineCore', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgEngineCore />);
    expect(baseElement).toBeTruthy();
  });
});
