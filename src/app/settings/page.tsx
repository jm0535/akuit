'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Key, Check, X, Shield, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/lib/theme-provider'
import { getApiKeys, saveApiKey, deleteApiKey, setActiveApiKey, maskApiKey, validateApiKey, type ApiKey } from '@/lib/api-keys'
import { motion, AnimatePresence } from 'framer-motion'

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const [apiKeys, setApiKeysState] = useState<ApiKey[]>([])
  const [showAddKey, setShowAddKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<ApiKey['provider']>('z-ai')
  const [showKey, setShowKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Load API keys function
  const loadApiKeys = async () => {
    const keys = await getApiKeys()
    setApiKeysState(keys)
  }

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys()
  }, [])

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a name and API key',
        variant: 'destructive',
      })
      return
    }

    setIsValidating(true)

    // Validate key format
    if (!validateApiKey(newKeyValue, selectedProvider)) {
      setIsValidating(false)
      toast({
        title: 'Invalid API key',
        description: getValidationMessage(selectedProvider),
        variant: 'destructive',
      })
      return
    }

    try {
      await saveApiKey({
        name: newKeyName.trim(),
        key: newKeyValue.trim(),
        provider: selectedProvider,
      })

      toast({
        title: 'API key added',
        description: 'Your API key has been saved securely',
      })

      // Reset form
      setNewKeyName('')
      setNewKeyValue('')
      setShowAddKey(false)

      // Reload keys
      await loadApiKeys()
    } catch (error) {
      toast({
        title: 'Failed to save API key',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    }

    setIsValidating(false)
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      await deleteApiKey(keyId)
      toast({
        title: 'API key deleted',
        description: 'The API key has been removed',
      })
      await loadApiKeys()
    } catch (error) {
      toast({
        title: 'Failed to delete API key',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const getValidationMessage = (provider: ApiKey['provider']): string => {
    switch (provider) {
      case 'z-ai':
        return 'API keys should be at least 32 characters';
      case 'openai':
        return 'OpenAI API keys should start with "sk-"';
      case 'anthropic':
        return 'Anthropic API keys should start with "sk-ant-"';
      case 'google':
        return 'Google API keys should start with "AIza" or "GOAI" or be at least 32 characters';
      case 'cohere':
        return 'Cohere API keys should be at least 32 characters';
      case 'huggingface':
        return 'Hugging Face API keys should start with "hf_" or be at least 32 characters';
      case 'stability':
        return 'Stability AI API keys should start with "sk-" or be at least 32 characters';
      case 'replicate':
        return 'Replicate API keys should start with "r8_" or be at least 32 characters';
      case 'together':
        return 'Together AI API keys should be at least 32 characters';
      case 'mistral':
        return 'Mistral AI API keys should be at least 32 characters';
      case 'xai':
        return 'xAI API keys should start with "xai-" or be at least 32 characters';
      case 'kimi':
        return 'Kimi (Moonshot AI) API keys should be at least 32 characters';
      case 'deepseek':
        return 'DeepSeek API keys should start with "sk-" or be at least 32 characters';
      case 'qwen':
        return 'Qwen (Alibaba Cloud) API keys should start with "sk-" or be at least 32 characters';
      case 'baichuan':
        return 'Baichuan AI API keys should be at least 32 characters';
      case 'yi':
        return 'Yi (01.AI) API keys should be at least 32 characters';
      case 'internlm':
        return 'InternLM AI API keys should be at least 32 characters';
      case 'zhipu':
        return 'Zhipu AI API keys should be at least 32 characters';
      case 'custom':
        return 'API key format is invalid';
      default:
        return 'API key format is invalid';
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                <p className="text-xs text-muted-foreground">API Key & Configuration</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your API keys are stored locally using AES-256 encryption. They are never sent to our servers.
                Only use keys from trusted providers.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Manage your AI provider API keys
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddKey(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No API keys configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Add an API key to start using AI features
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <motion.div
                        key={key.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-semibold">{key.name}</h4>
                              <Badge variant="outline">
                                {key.provider}
                              </Badge>
                              {key.isValid !== undefined && (
                                <Badge variant={key.isValid ? 'default' : 'destructive'}>
                                  {key.isValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="font-mono bg-background p-2 rounded border border-border">
                                {maskApiKey(key.key)}
                              </div>
                              <div className="text-xs">
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                                {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKey(key.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Key Form */}
            <AnimatePresence>
              {showAddKey && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New API Key</CardTitle>
                      <CardDescription>
                        Enter your AI provider API key to enable AI features
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                          id="keyName"
                          placeholder="e.g., My Production Key"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <select
                          id="provider"
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value as ApiKey['provider'])}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        >
                          <option value="z-ai">Z.ai</option>
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="google">Google (Gemini)</option>
                          <option value="cohere">Cohere</option>
                          <option value="huggingface">Hugging Face</option>
                          <option value="stability">Stability AI</option>
                          <option value="replicate">Replicate</option>
                          <option value="together">Together AI</option>
                          <option value="mistral">Mistral AI</option>
                          <option value="xai">xAI (Grok)</option>
                          <option value="kimi">Kimi (Moonshot AI)</option>
                          <option value="deepseek">DeepSeek</option>
                          <option value="qwen">Qwen (Alibaba Cloud)</option>
                          <option value="baichuan">Baichuan AI</option>
                          <option value="yi">Yi (01.AI)</option>
                          <option value="internlm">InternLM AI</option>
                          <option value="zhipu">Zhipu AI</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="apiKey"
                            type={showKey ? 'text' : 'password'}
                            placeholder="Enter your API key"
                            value={newKeyValue}
                            onChange={(e) => setNewKeyValue(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                          >
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleAddKey} disabled={isValidating} className="flex-1">
                          {isValidating ? (
                            <>Validating...</>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Save Key
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddKey(false)
                            setNewKeyName('')
                            setNewKeyValue('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your interface appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      System
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'system' ? 'Following your system preference' : `${theme.charAt(0).toUpperCase()}${theme.slice(1)} theme enabled`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  For self-hosted deployments, configure these environment variables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="font-mono text-sm">ZAI_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Your Z.ai API key for production use
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">OPENAI_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    OpenAI API key for GPT models
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">ANTHROPIC_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Anthropic API key for Claude models
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">GOOGLE_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Google API key for Gemini models
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">COHERE_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Cohere API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">HUGGINGFACE_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Hugging Face API key for transformers models
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">STABILITY_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Stability AI API key for image generation
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">REPLICATE_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Replicate API key for running AI models
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">TOGETHER_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Together AI API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">MISTRAL_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Mistral AI API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">XAI_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    xAI API key for Grok models
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">KIMI_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Kimi (Moonshot AI) API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">DEEPSEEK_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    DeepSeek API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">QWEN_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Qwen (Alibaba Cloud) API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">BAICHUAN_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Baichuan AI API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">YI_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Yi (01.AI) API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">INTERNLM_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    InternLM AI API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">ZHIPU_API_KEY</Label>
                  <p className="text-xs text-muted-foreground">
                    Zhipu AI API key
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-sm">ZAI_API_ENDPOINT</Label>
                  <p className="text-xs text-muted-foreground">
                    Custom API endpoint (optional)
                  </p>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Environment variables take priority over stored keys. Configure them in your .env file or deployment platform settings.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Akuit. Premium enterprise acquittal review and reporting.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
