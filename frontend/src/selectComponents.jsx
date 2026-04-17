import { components } from 'react-select'

/**
 * Composants react-select partagés : affiche le texte complet
 * en tooltip (title) sur la valeur sélectionnée et les tags multi.
 */
export const SingleValue = ({ children, data, ...props }) => (
  <components.SingleValue {...props}>
    <span title={data.label}>{children}</span>
  </components.SingleValue>
)

export const MultiValueLabel = ({ children, data, ...props }) => (
  <components.MultiValueLabel {...props}>
    <span title={data.label}>{children}</span>
  </components.MultiValueLabel>
)

export const rsComponents = { SingleValue, MultiValueLabel }
