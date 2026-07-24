import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const Verify = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            
            if (!token) {
                setStatus('error');
                setMessage('Missing verification token. Please check your email link or try registering again.');
                return;
            }

            try {
                const response = await apiClient.get(`/auth/verify?token=${token}`);
                if (response.status === 200) {
                    setStatus('success');
                    setMessage('Your email has been verified successfully!');
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
            } catch (error) {
                setStatus('error');
                setMessage('The verification link is invalid or has expired. Please try registering again.');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f5f5 0%, #e4e4e7 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                maxWidth: '480px',
                width: '100%',
                padding: '48px 32px',
                textAlign: 'center'
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                        }}>
                            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.416" strokeDashoffset="10">
                                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                                </circle>
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#18181b', marginBottom: '12px', letterSpacing: '-0.025em' }}>
                            Verifying...
                        </h1>
                        <p style={{ fontSize: '16px', color: '#71717a', lineHeight: '1.6' }}>
                            Please wait while we verify your email address.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                        }}>
                            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#18181b', marginBottom: '12px', letterSpacing: '-0.025em' }}>
                            Email Verified Successfully!
                        </h1>
                        <p style={{ fontSize: '16px', color: '#71717a', lineHeight: '1.6', marginBottom: '32px' }}>
                            {message}
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px 24px',
                                background: '#18181b',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#27272a';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#18181b';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            Go to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
                        }}>
                            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#18181b', marginBottom: '12px', letterSpacing: '-0.025em' }}>
                            Verification Failed
                        </h1>
                        <p style={{ fontSize: '16px', color: '#71717a', lineHeight: '1.6', marginBottom: '32px' }}>
                            {message}
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px 24px',
                                background: '#18181b',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#27272a';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#18181b';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            Try Again
                        </button>
                    </>
                )}

                <div style={{ marginTop: '24px', fontSize: '12px', color: '#a1a1aa' }}>
                    WorkSync SaaS
                </div>
            </div>
        </div>
    );
};

export default Verify;