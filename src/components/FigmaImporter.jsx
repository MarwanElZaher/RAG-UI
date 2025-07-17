import React, { useState, useEffect } from 'react';
import {
    Figma, Upload, Download, Code, Eye, Settings, CheckCircle, AlertCircle,
    RefreshCw, Map, Book, Layers, Zap, Clock, FileCode, Package,
    ExternalLink, Copy, Play, Brain, ChevronDown, ChevronUp, X
} from 'lucide-react';

// Custom hook for API calls (implement this based on your API setup)
const useApi = () => {
    const [loading, setLoading] = useState(false);

    const request = async (url, options = {}) => {
        setLoading(true);
        try {
            const response = await fetch(`/api${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            const data = await response.json();
            setLoading(false);
            return data;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    return { request, loading };
};

const FigmaImporter = () => {
    const [figmaUrl, setFigmaUrl] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [options, setOptions] = useState({
        includeComponents: true,
        includeStyles: true,
        targetEcosystem: ['ma-lib'],
        codeFramework: 'react',
        generateTests: false
    });
    const [conversationId, setConversationId] = useState(null);
    const [step, setStep] = useState('input'); // input, analyzing, results
    const [analysis, setAnalysis] = useState(null);
    const [generatedCode, setGeneratedCode] = useState(null);
    const [tokenValid, setTokenValid] = useState(null);
    const [urlValid, setUrlValid] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [copySuccess, setCopySuccess] = useState({});
    const { request, loading } = useApi();

    useEffect(() => {
        // Create conversation ID for this session
        setConversationId(`figma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }, []);

    useEffect(() => {
        validateUrl();
    }, [figmaUrl]);

    useEffect(() => {
        if (accessToken.length > 10) {
            validateToken();
        }
    }, [accessToken]);

    const validateUrl = async () => {
        if (!figmaUrl.trim()) {
            setUrlValid(null);
            return;
        }

        try {
            const result = await request('/figma/parse-url', {
                method: 'POST',
                body: JSON.stringify({ figmaUrl })
            });
            setUrlValid(result.success);
        } catch (error) {
            setUrlValid(false);
        }
    };

    const validateToken = async () => {
        if (!accessToken.trim()) {
            setTokenValid(null);
            return;
        }

        try {
            const result = await request('/figma/validate-token', {
                method: 'POST',
                body: JSON.stringify({ accessToken })
            });
            setTokenValid(result.data.valid);
        } catch (error) {
            setTokenValid(false);
        }
    };

    const handleEcosystemToggle = (ecosystem) => {
        setOptions(prev => ({
            ...prev,
            targetEcosystem: prev.targetEcosystem.includes(ecosystem)
                ? prev.targetEcosystem.filter(e => e !== ecosystem)
                : [...prev.targetEcosystem, ecosystem]
        }));
    };

    const analyzeDesign = async () => {
        try {
            setStep('analyzing');
            console.log('🔍 Starting design analysis...');

            const result = await request('/figma/analyze', {
                method: 'POST',
                body: JSON.stringify({
                    figmaUrl,
                    accessToken,
                    targetEcosystem: options.targetEcosystem
                })
            });

            if (result.success) {
                setAnalysis(result.data.analysis);
                console.log('✅ Analysis complete:', result.data.analysis);
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('❌ Analysis error:', error);
            alert(`Analysis failed: ${error.message}`);
            setStep('input');
        }
    };

    const generateCode = async () => {
        try {
            console.log('🚀 Starting code generation...');

            const result = await request('/figma/import', {
                method: 'POST',
                body: JSON.stringify({
                    figmaUrl,
                    accessToken,
                    options,
                    conversationId
                })
            });

            if (result.success) {
                setGeneratedCode(result.data.generatedCode);
                setAnalysis(result.data.analysis);
                setStep('results');
                console.log('✅ Code generation complete:', result.data);
            } else {
                throw new Error(result.error || 'Code generation failed');
            }
        } catch (error) {
            console.error('❌ Generation error:', error);
            alert(`Code generation failed: ${error.message}`);
        }
    };

    const exportCode = async () => {
        try {
            const result = await request('/figma/export-code', {
                method: 'POST',
                body: JSON.stringify({ generatedCode })
            });

            if (result.success) {
                // Create and download JSON file with code
                const blob = new Blob([JSON.stringify(result.data, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `figma-generated-code-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert(`Export failed: ${error.message}`);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopySuccess({ ...copySuccess, [id]: true });
        setTimeout(() => {
            setCopySuccess({ ...copySuccess, [id]: false });
        }, 2000);
    };

    const InputStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <Figma size={48} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Figma Design</h2>
                <p className="text-gray-600">
                    Convert your Figma designs into working Penta-B ecosystem code
                </p>
            </div>

            {/* Figma URL Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Figma Design URL
                </label>
                <div className="relative">
                    <input
                        type="url"
                        value={figmaUrl}
                        onChange={(e) => setFigmaUrl(e.target.value)}
                        placeholder="https://www.figma.com/file/..."
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${urlValid === false ? 'border-red-500' :
                            urlValid === true ? 'border-green-500' : 'border-gray-300'
                            }`}
                    />
                    {urlValid !== null && (
                        <div className="absolute right-2 top-2">
                            {urlValid ? (
                                <CheckCircle className="text-green-500" size={20} />
                            ) : (
                                <AlertCircle className="text-red-500" size={20} />
                            )}
                        </div>
                    )}
                </div>
                {urlValid === false && (
                    <p className="text-red-500 text-sm mt-1">Invalid Figma URL format</p>
                )}
            </div>

            {/* Access Token Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Figma Access Token
                </label>
                <div className="relative">
                    <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Enter your Figma personal access token"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${tokenValid === false ? 'border-red-500' :
                            tokenValid === true ? 'border-green-500' : 'border-gray-300'
                            }`}
                    />
                    {tokenValid !== null && (
                        <div className="absolute right-2 top-2">
                            {tokenValid ? (
                                <CheckCircle className="text-green-500" size={20} />
                            ) : (
                                <AlertCircle className="text-red-500" size={20} />
                            )}
                        </div>
                    )}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                    Get your token from Figma Settings → Account → Personal access tokens
                </p>
            </div>

            {/* Target Ecosystem */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Ecosystem Components
                </label>
                <div className="space-y-2">
                    {[
                        { id: 'ma-lib', name: 'Ma-Lib', icon: Book, desc: 'Form components & UI library' },
                        { id: 'ol-map', name: 'Ol-Map', icon: Map, desc: 'Geospatial components' },
                        { id: 'plugins', name: 'Plugins', icon: Layers, desc: 'Plugin architecture' }
                    ].map(ecosystem => (
                        <label key={ecosystem.id} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={options.targetEcosystem.includes(ecosystem.id)}
                                onChange={() => handleEcosystemToggle(ecosystem.id)}
                                className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <ecosystem.icon size={20} className="mr-2 text-gray-600" />
                                    <span className="font-medium">{ecosystem.name}</span>
                                </div>
                                <p className="text-sm text-gray-500">{ecosystem.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Framework Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Framework
                </label>
                <select
                    value={options.codeFramework}
                    onChange={(e) => setOptions({ ...options, codeFramework: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="react">React</option>
                    <option value="vue">Vue.js</option>
                    <option value="angular">Angular</option>
                </select>
            </div>

            {/* Advanced Options */}
            <div>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                    <Settings size={16} className="mr-1" />
                    Advanced Options
                    {showAdvanced ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                </button>

                {showAdvanced && (
                    <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={options.includeComponents}
                                onChange={(e) => setOptions({ ...options, includeComponents: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-sm">Include reusable components</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={options.includeStyles}
                                onChange={(e) => setOptions({ ...options, includeStyles: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-sm">Include design system styles</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={options.generateTests}
                                onChange={(e) => setOptions({ ...options, generateTests: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-sm">Generate unit tests</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={analyzeDesign}
                    disabled={!figmaUrl || !accessToken || loading}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <RefreshCw className="animate-spin mr-2" size={20} />
                    ) : (
                        <Eye className="mr-2" size={20} />
                    )}
                    Analyze Design
                </button>
            </div>
        </div>
    );

    const AnalyzingStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <Brain size={48} className="mx-auto text-blue-600 mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Design</h2>
                <p className="text-gray-600">
                    {analysis ? 'Analysis complete! Ready to generate code.' : 'Analyzing your Figma design...'}
                </p>
            </div>

            {analysis && (
                <div className="space-y-4">
                    {/* Analysis Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Design Analysis</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Complexity</p>
                                <p className="font-medium">{analysis.complexity}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Components</p>
                                <p className="font-medium">{analysis.componentCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Frames</p>
                                <p className="font-medium">{analysis.frameCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Est. Time</p>
                                <p className="font-medium">{analysis.estimatedDevelopmentTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Suggested Components */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Suggested Components</h3>
                        <div className="space-y-2">
                            {analysis.suggestedComponents.slice(0, 5).map((comp, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm">{comp.componentName}</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {comp.ecosystemType}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Layout Patterns */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Detected Patterns</h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.layoutPatterns.map((pattern, index) => (
                                <span key={index} className="text-xs bg-gray-200 px-2 py-1 rounded">
                                    {pattern.type}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep('input')}
                            className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50"
                        >
                            Back to Settings
                        </button>
                        <button
                            onClick={generateCode}
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <RefreshCw className="animate-spin mr-2" size={20} />
                            ) : (
                                <Code className="mr-2" size={20} />
                            )}
                            Generate Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const ResultsStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Code Generated Successfully!</h2>
                <p className="text-gray-600">
                    Your Figma design has been converted to Penta-B ecosystem code
                </p>
            </div>

            {generatedCode && (
                <div className="space-y-4">
                    {/* Generated Files */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Generated Files ({generatedCode.files.length})</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {generatedCode.files.map((file, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedFile(file)}
                                    className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-gray-100"
                                >
                                    <div className="flex items-center">
                                        <FileCode size={16} className="mr-2 text-gray-600" />
                                        <span className="text-sm font-medium">{file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {file.ecosystem}
                                        </span>
                                        <span className="text-xs text-gray-500">{file.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Container Registrations */}
                    {generatedCode.containerRegistrations.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold mb-3">Container Registrations</h3>
                            <div className="space-y-2">
                                {generatedCode.containerRegistrations.map((reg, index) => (
                                    <div key={index} className="text-sm">
                                        <code className="bg-gray-200 px-2 py-1 rounded">{reg.containerName}</code>
                                        <span className="text-gray-600 ml-2">→ {reg.componentName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dependencies */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Required Dependencies</h3>
                        <div className="space-y-2">
                            {generatedCode.dependencies.map((dep, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Package size={16} className="mr-2 text-gray-600" />
                                        <span className="text-sm font-mono">{dep.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{dep.version}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                setStep('input');
                                setGeneratedCode(null);
                                setAnalysis(null);
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50"
                        >
                            Import Another Design
                        </button>
                        <button
                            onClick={exportCode}
                            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                            <Download className="mr-2" size={20} />
                            Export Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // File Preview Modal
    const FilePreviewModal = () => {
        if (!selectedFile) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold">{selectedFile.name}</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => copyToClipboard(selectedFile.content, selectedFile.name)}
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                                {copySuccess[selectedFile.name] ? (
                                    <CheckCircle size={20} className="mr-1" />
                                ) : (
                                    <Copy size={20} className="mr-1" />
                                )}
                                {copySuccess[selectedFile.name] ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 overflow-auto max-h-[60vh]">
                        <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                            <code>{selectedFile.content}</code>
                        </pre>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        {['Input', 'Analyze', 'Generate'].map((s, index) => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${index === 0 && step === 'input' ? 'bg-blue-600 text-white' :
                                    index === 1 && step === 'analyzing' ? 'bg-blue-600 text-white' :
                                        index === 2 && step === 'results' ? 'bg-green-600 text-white' :
                                            'bg-gray-200 text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                {index < 2 && (
                                    <div className={`w-24 h-1 ${(step === 'analyzing' && index === 0) ||
                                        (step === 'results' && index <= 1)
                                        ? 'bg-blue-600'
                                        : 'bg-gray-200'
                                        }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-around mt-2">
                        {['Input Details', 'Analyze Design', 'Generate Code'].map(label => (
                            <span key={label} className="text-xs text-gray-600">{label}</span>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                {step === 'input' && <InputStep />}
                {step === 'analyzing' && <AnalyzingStep />}
                {step === 'results' && <ResultsStep />}
            </div>

            {/* File Preview Modal */}
            <FilePreviewModal />
        </div>
    );
};

export default FigmaImporter;