/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { TextField, Button } from '@wso2/ui-toolkit';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useVisualizerContext } from '@wso2/mi-rpc-client';
import { EVENT_TYPE, MACHINE_VIEW } from '@wso2/mi-core';
import { View, ViewContent, ViewHeader } from '../../../components/View';
import AddToolDialog from './AddToolDialog';

// Types
interface APIOperation {
    id: string;
    method: string;
    path: string;
    summary: string;
}

interface API {
    id: string;
    name: string;
    context: string;
    version: string;
    operations: APIOperation[];
}

interface Tool {
    id: string;
    name: string;
    apiId: string;
    apiName: string;
    operationId: string;
    operationMethod: string;
    operationPath: string;
}

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
    max-width: 900px;
`;

const Title = styled.h2`
    color: var(--vscode-editor-foreground);
    margin: 0 0 10px 0;
    font-size: 20px;
    font-weight: 600;
`;

const Description = styled.p`
    color: var(--vscode-descriptionForeground);
    margin: 0 0 20px 0;
    font-size: 13px;
`;

const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const SectionLabel = styled.label`
    color: var(--vscode-editor-foreground);
    font-weight: 500;
    font-size: 14px;
    display: block;
`;

const OperationsContainer = styled.div`
    border-top: 1px solid var(--vscode-panel-border);
`;

const OperationRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
    
    &:hover {
        background: var(--vscode-list-hoverBackground);
    }
    
    &:last-child {
        border-bottom: none;
    }
`;

const MethodBadge = styled.span<{ method: string }>`
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    background: ${(props: any) => {
        const m = props.method?.toUpperCase() || '';
        const colors: any = { GET: '#61affe', POST: '#49cc90', PUT: '#fca130', DELETE: '#f93e3e', PATCH: '#50e3c2' };
        return colors[m] || '#999';
    }};
    color: white;
    min-width: 45px;
    text-align: center;
`;

const OperationPath = styled.span`
    color: var(--vscode-editor-foreground);
    font-family: monospace;
    font-size: 12px;
    flex: 1;
`;

const OperationSummary = styled.span`
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
`;

const AddToolBtn = styled.button`
    padding: 4px 8px;
    font-size: 11px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    white-space: nowrap;
    
    &:hover {
        background: var(--vscode-button-hoverBackground);
    }
`;

const ToolsSection = styled.div`
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background: var(--vscode-input-background);
`;

const ToolsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
`;

const ToolItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 3px;
`;

const ToolNameInput = styled.input`
    flex: 1;
    background: var(--vscode-input-background);
    color: var(--vscode-editor-foreground);
    border: 1px solid var(--vscode-panel-border);
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
    
    &:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
`;

const ToolMeta = styled.span`
    color: var(--vscode-descriptionForeground);
    font-size: 11px;
    font-family: monospace;
`;

const RemoveBtn = styled.button`
    padding: 4px 8px;
    font-size: 11px;
    background: var(--vscode-errorForeground);
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    
    &:hover {
        opacity: 0.8;
    }
`;

const EmptyMessage = styled.div`
    color: var(--vscode-descriptionForeground);
    text-align: center;
    padding: 15px;
    font-size: 12px;
`;

const ErrorMessage = styled.div`
    color: var(--vscode-inputValidation-errorBorder);
    padding: 10px;
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 4px;
    background: var(--vscode-inputValidation-errorBackground);
    font-size: 12px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
`;

const AddToolMainBtn = styled.button`
    padding: 8px 16px;
    font-size: 13px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
    align-self: flex-start;
    
    &:hover {
        background: var(--vscode-button-hoverBackground);
    }
`;

const schema = yup.object({
    serverName: yup.string()
        .required('Server name is required')
        .min(3, 'Server name must be at least 3 characters')
        .matches(/^[a-zA-Z0-9_-]+$/, 'Server name can only contain letters, numbers, hyphens, and underscores'),
});

// Define artifact parsing configuration (same approach as ProjectStructureView)
const artifactParserConfig = {
    apis: {
        pathInStructure: (structure: any) => structure?.directoryMap?.src?.main?.wso2mi?.artifacts?.apis || [],
        parseFields: {
            id: (art: Record<string, any>) => art.name || art.id || art.fileName || '',
            name: (art: Record<string, any>) => art.name || art.id || art.fileName || '',
            context: (art: Record<string, any>) => art.context || `/${art.name || art.id || ''}`,
            version: (art: Record<string, any>) => art.version || '1.0.0',
        },
        parseOperations: (art: Record<string, any>): APIOperation[] => {
            const operations: APIOperation[] = [];
            if (art.resources && Array.isArray(art.resources)) {
                for (const res of art.resources) {
                    const methods = Array.isArray(res.methods)
                        ? res.methods
                        : typeof res.methods === 'string'
                        ? res.methods.split(',')
                        : [];
                    const uri = res.path || res.uri || res['uri-template'] || res.uriTemplate || '';

                    for (const m of methods) {
                        const method = String(m).toUpperCase();
                        operations.push({
                            id: `${method}_${uri}`.replace(/[^a-zA-Z0-9_]/g, '_'),
                            method,
                            path: uri,
                            summary: res.summary || ''
                        });
                    }
                }
            }
            return operations;
        }
    }
};

export interface MCPServerFromAPIsFormProps {
    path: string;
}

export function MCPServerFromAPIsForm({ path }: MCPServerFromAPIsFormProps) {
    const { rpcClient } = useVisualizerContext();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { serverName: '' }
    });

    const [apis, setApis] = useState<API[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddToolDialog, setShowAddToolDialog] = useState(false);
    const [selectedAPIForTool, setSelectedAPIForTool] = useState<string>('');

    // Fetch APIs with their operations
    useEffect(() => {
        const loadAPIs = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let projectUri = path;
                const artifactsIndex = projectUri.indexOf('/artifacts');
                if (artifactsIndex !== -1) {
                    projectUri = projectUri.substring(0, artifactsIndex).replace(/\/src\/main\/wso2mi$/, '');
                }

                // Fetch project structure
                const projectStructure = await rpcClient.getMiVisualizerRpcClient().getProjectStructure({
                    documentUri: projectUri
                });

                const apiArtifacts = artifactParserConfig.apis.pathInStructure(projectStructure);
                const parsedAPIs: API[] = apiArtifacts.map((art: Record<string, any>) => ({
                    id: artifactParserConfig.apis.parseFields.id(art),
                    name: artifactParserConfig.apis.parseFields.name(art),
                    context: artifactParserConfig.apis.parseFields.context(art),
                    version: artifactParserConfig.apis.parseFields.version(art),
                    operations: artifactParserConfig.apis.parseOperations(art)
                }));

                if (parsedAPIs.length > 0) {
                    setApis(parsedAPIs);
                } else {
                    setApis([]);
                    setError('No APIs found in the project');
                }
            } catch (err) {
                console.error('Error loading APIs:', err);
                setError(`Failed to load APIs from project: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        loadAPIs();
    }, [rpcClient, path]);

    const openAddToolDialog = () => {
        setShowAddToolDialog(true);
        setSelectedAPIForTool('');
    };

    const closeAddToolDialog = () => {
        setShowAddToolDialog(false);
        setSelectedAPIForTool('');
    };

    const confirmAddBulkTools = (apiId: string, selectedOperations: Array<{ id: string; customName: string }>) => {
        const api = apis.find(a => a.id === apiId);
        if (!api) return;

        const newTools: Tool[] = selectedOperations
            .map(selectedOp => {
                const operation = api.operations.find(o => o.id === selectedOp.id);
                if (!operation) return null;

                return {
                    id: `tool-${Date.now()}-${selectedOp.id}`,
                    name: selectedOp.customName.trim() || `${operation.method}_${operation.path.replace(/[^a-zA-Z0-9_]/g, '_')}`,
                    apiId: api.id,
                    apiName: api.name,
                    operationId: operation.id,
                    operationMethod: operation.method,
                    operationPath: operation.path,
                };
            })
            .filter((tool): tool is Tool => tool !== null);

        setTools([...tools, ...newTools]);
        closeAddToolDialog();
        setError(null);
    };

    const removeTool = (toolId: string) => {
        setTools(tools.filter(t => t.id !== toolId));
    };

    const updateToolName = (toolId: string, newName: string) => {
        setTools(tools.map(t => t.id === toolId ? { ...t, name: newName } : t));
    };

    const onSubmit = async (data: any) => {
        if (tools.length === 0) {
            setError('Please add at least one tool');
            return;
        }

        setSubmitting(true);
        try {
            setError(null);

            const mcpConfig = {
                name: data.serverName,
                type: 'from-apis',
                tools: tools.map(t => ({
                    toolName: t.name,
                    apiId: t.apiId,
                    apiName: t.apiName,
                    operationMethod: t.operationMethod,
                    operationPath: t.operationPath,
                })),
            };

            console.log('MCP Server config:', mcpConfig);

            rpcClient.getMiVisualizerRpcClient().openView({
                type: EVENT_TYPE.OPEN_VIEW,
                location: { view: MACHINE_VIEW.Overview }
            });
        } catch (err) {
            console.error('Error creating MCP Server:', err);
            setError(`Failed to create MCP Server: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View>
            <ViewHeader title="Create MCP Server from APIs" icon="server" />
            <ViewContent padding>
                <Container>
                    <div>
                        <Title>Create Tools from API Operations</Title>
                        <Description>
                            Add tools by selecting API operations and giving them custom names.
                        </Description>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Server Name */}
                        <FormSection>
                            <SectionLabel>Server Name</SectionLabel>
                            <TextField
                                placeholder="e.g., my-mcp-server"
                                {...register('serverName')}
                            />
                            {errors.serverName && (
                                <ErrorMessage>{String(errors.serverName?.message)}</ErrorMessage>
                            )}
                        </FormSection>

                        {/* Add Tool Section */}
                        <FormSection>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <SectionLabel>Tools ({tools.length})</SectionLabel>
                                <AddToolMainBtn type="button" onClick={openAddToolDialog}>
                                    + Add Tool
                                </AddToolMainBtn>
                            </div>

                            {tools.length === 0 ? (
                                <EmptyMessage>No tools added yet. Click "Add Tool" to create one.</EmptyMessage>
                            ) : (
                                <ToolsList>
                                    {tools.map(tool => (
                                        <ToolItem key={tool.id}>
                                            <ToolNameInput
                                                type="text"
                                                value={tool.name}
                                                onChange={(e) => updateToolName(tool.id, e.target.value)}
                                                placeholder="Tool name"
                                            />
                                            <ToolMeta>
                                                <MethodBadge method={tool.operationMethod} style={{ marginRight: '4px' }}>
                                                    {tool.operationMethod}
                                                </MethodBadge>
                                                {tool.operationPath} ({tool.apiName})
                                            </ToolMeta>
                                            <RemoveBtn onClick={() => removeTool(tool.id)}>✕</RemoveBtn>
                                        </ToolItem>
                                    ))}
                                </ToolsList>
                            )}
                        </FormSection>

                        {error && <ErrorMessage>{error}</ErrorMessage>}

                        {/* Buttons */}
                        <ButtonGroup>
                            <Button
                                appearance="secondary"
                                onClick={() => {
                                    rpcClient.getMiVisualizerRpcClient().openView({
                                        type: EVENT_TYPE.OPEN_VIEW,
                                        location: { view: 'MCPServerForm' as any, documentUri: path }
                                    });
                                }}
                            >
                                Back
                            </Button>
                            <Button
                                appearance="primary"
                                disabled={submitting || loading || tools.length === 0}
                                onClick={handleSubmit(onSubmit)}
                            >
                                {submitting ? 'Creating...' : `Create MCP Server (${tools.length} tool${tools.length !== 1 ? 's' : ''})`}
                            </Button>
                        </ButtonGroup>
                    </form>
                </Container>
                {/* Add Tool Dialog */}
                <AddToolDialog
                    isOpen={showAddToolDialog}
                    apis={apis}
                    selectedAPIForTool={selectedAPIForTool}
                    onAPIChange={setSelectedAPIForTool}
                    onConfirmBulk={confirmAddBulkTools}
                    onCancel={closeAddToolDialog}
                />
            </ViewContent>
        </View>
    );
}

export default MCPServerFromAPIsForm;
