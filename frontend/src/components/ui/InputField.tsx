import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const InputField: React.FC<Props> = ({ label, ...props }) => {
    return (
        <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {label}
            </label>
            <input
                style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                }}
                {...props}
            />
        </div>
    );
};

export default InputField;