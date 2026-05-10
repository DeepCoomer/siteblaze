import { render } from '@testing-library/react';

import OrgUiElements from './ui-elements';

describe('OrgUiElements', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgUiElements />);
    expect(baseElement).toBeTruthy();
  });
});
