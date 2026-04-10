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
import * as pathModule from 'path';

//  Types 
interface Sequence {
    id: string;
    name: string;
    xmlPath: string;
}

interface SequenceTool {
    id: string;
    name: string;
    description: string;
    sequenceName: string;
    sequenceXmlPath: string;
    inputSchema: string;
}

//  Styled Components 

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

const ToolsSectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ToolInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
`;

const ToolName = styled.span`
    font-weight: 600;
    font-size: 12px;
    color: var(--vscode-editor-foreground);
`;

const ToolDescription = styled.span`
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
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

//  Dialog Styled Components 

const DialogOverlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const DialogContent = styled.div`
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 20px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const DialogTitle = styled.h3`
    color: var(--vscode-editor-foreground);
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
`;

const DialogField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
`;

const DialogLabel = styled.label`
    color: var(--vscode-editor-foreground);
    font-size: 12px;
    font-weight: 500;
`;

const SequencesList = styled.div`
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
`;

const SequenceItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--vscode-panel-border);

    &:last-child { border-bottom: none; }
    &:hover { background: var(--vscode-list-hoverBackground); }
`;

const SequenceItemHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const SequenceCheckbox = styled.input`
    cursor: pointer;
    accent-color: var(--vscode-focusBorder);
    margin-top: 2px;
`;

const SequenceName = styled.span`
    color: var(--vscode-editor-foreground);
    font-family: monospace;
    font-size: 12px;
`;

const SelectAllRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
    background: var(--vscode-list-activeSelectionBackground);
`;

const SelectAllLabel = styled.label`
    cursor: pointer;
    margin-bottom: 0;
    font-size: 12px;
    color: var(--vscode-editor-foreground);
`;

const CustomInputsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-left: 26px;
`;

const InputFieldLabel = styled.label`
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-top: 2px;
`;

const CustomInput = styled.input`
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    border: 1px solid var(--vscode-input-border);
    padding: 4px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
`;

const DialogButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    justify-content: space-between;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--vscode-panel-border);
`;

const SelectionInfo = styled.span`
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    align-self: center;
`;

const DialogBtn = styled.button`
    padding: 6px 12px;
    font-size: 12px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
`;

const DialogCancelBtn = styled(DialogBtn)`
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    &:hover { background: var(--vscode-button-secondaryHoverBackground); }
`;

const DialogAddBtn = styled(DialogBtn)`
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    &:hover { background: var(--vscode-button-hoverBackground); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

//  Add Sequence Tool Dialog 
interface AddSequenceToolDialogProps {
    isOpen: boolean;
    sequences: Sequence[];
    onConfirm: (selected: Array<{ sequenceId: string; customName: string; description: string; inputSchema: string }>) => void;
    onCancel: () => void;
}

const SchemaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const SchemaTextarea = styled.textarea`
    width: 100%;
    min-height: 80px;
    padding: 6px 8px;
    font-size: 12px;
    font-family: var(--vscode-editor-font-family, monospace);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
    border-radius: 3px;
    resize: vertical;
    box-sizing: border-box;
    &:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
`;

const SchemaImportBtn = styled.button`
    padding: 4px 10px;
    font-size: 12px;
    white-space: nowrap;
    border: 1px solid var(--vscode-button-secondaryBackground);
    border-radius: 3px;
    cursor: pointer;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    &:hover { background: var(--vscode-button-secondaryHoverBackground); }
`;

const SchemaError = styled.span`
    color: var(--vscode-inputValidation-errorForeground, var(--vscode-errorForeground));
    font-size: 11px;
`;

function AddSequenceToolDialog({ isOpen, sequences, onConfirm, onCancel }: AddSequenceToolDialogProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [customNames, setCustomNames] = useState<Record<string, string>>({});
    const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
    const [inputSchemas, setInputSchemas] = useState<Record<string, string>>({});
    const [schemaErrors, setSchemaErrors] = useState<Record<string, string>>({});
    const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

    if (!isOpen) return null;

    const toggleSequence = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === sequences.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sequences.map(s => s.id)));
        }
    };

    const validateSchema = (id: string, value: string): boolean => {
        if (!value.trim()) {
            setSchemaErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
            return true;
        }
        try {
            JSON.parse(value);
            setSchemaErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
            return true;
        } catch {
            setSchemaErrors(prev => ({ ...prev, [id]: 'Invalid JSON' }));
            return false;
        }
    };

    const handleSchemaChange = (id: string, value: string) => {
        setInputSchemas(prev => ({ ...prev, [id]: value }));
        validateSchema(id, value);
    };

    const handleImportFile = (id: string) => {
        fileInputRefs.current[id]?.click();
    };

    const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setInputSchemas(prev => ({ ...prev, [id]: content }));
            validateSchema(id, content);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleConfirm = () => {
        if (selectedIds.size === 0) return;
        const hasErrors = Array.from(selectedIds).some(id => schemaErrors[id]);
        if (hasErrors) return;
        const emptySchema = JSON.stringify({ type: 'object', properties: {}, additionalProperties: false });
        const selected = Array.from(selectedIds).map(id => ({
            sequenceId: id,
            customName: customNames[id]?.trim() || id,
            description: customDescriptions[id]?.trim() || '',
            inputSchema: inputSchemas[id]?.trim() || emptySchema,
        }));
        onConfirm(selected);
        setSelectedIds(new Set());
        setCustomNames({});
        setCustomDescriptions({});
        setInputSchemas({});
        setSchemaErrors({});
    };

    const allSelected = sequences.length > 0 && selectedIds.size === sequences.length;
    const hasSchemaErrors = Array.from(selectedIds).some(id => schemaErrors[id]);

    return (
        <DialogOverlay onClick={onCancel}>
            <DialogContent onClick={e => e.stopPropagation()}>
                <DialogTitle>Add Tools from Sequences</DialogTitle>

                <DialogField>
                    <DialogLabel>
                        Select Sequences ({selectedIds.size} of {sequences.length})
                    </DialogLabel>
                    {sequences.length === 0 ? (
                        <EmptyMessage>No sequences found in the project</EmptyMessage>
                    ) : (
                        <SequencesList>
                            <SelectAllRow>
                                <SequenceCheckbox
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    id="select-all-sequences"
                                />
                                <SelectAllLabel htmlFor="select-all-sequences">
                                    <strong>Select All Sequences</strong>
                                </SelectAllLabel>
                            </SelectAllRow>
                            {sequences.map(seq => (
                                <SequenceItem key={seq.id}>
                                    <SequenceItemHeader>
                                        <SequenceCheckbox
                                            type="checkbox"
                                            checked={selectedIds.has(seq.id)}
                                            onChange={() => toggleSequence(seq.id)}
                                            id={`seq-${seq.id}`}
                                        />
                                        <SequenceName>{seq.name}</SequenceName>
                                    </SequenceItemHeader>
                                    {selectedIds.has(seq.id) && (
                                        <CustomInputsContainer>
                                            <InputFieldLabel htmlFor={`name-${seq.id}`}>Tool name</InputFieldLabel>
                                            <CustomInput
                                                id={`name-${seq.id}`}
                                                type="text"
                                                placeholder={seq.name}
                                                value={customNames[seq.id] || ''}
                                                onChange={e => setCustomNames(prev => ({ ...prev, [seq.id]: e.target.value }))}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <InputFieldLabel htmlFor={`desc-${seq.id}`}>Description</InputFieldLabel>
                                            <CustomInput
                                                id={`desc-${seq.id}`}
                                                type="text"
                                                placeholder="Describe what this tool does"
                                                value={customDescriptions[seq.id] || ''}
                                                onChange={e => setCustomDescriptions(prev => ({ ...prev, [seq.id]: e.target.value }))}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <InputFieldLabel>Input Schema (JSON)</InputFieldLabel>
                                            <SchemaRow>
                                                <SchemaTextarea
                                                    placeholder='e.g. {"type":"object","properties":{"param":{"type":"string"}}}'
                                                    value={inputSchemas[seq.id] || ''}
                                                    onChange={e => handleSchemaChange(seq.id, e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                                <SchemaImportBtn
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); handleImportFile(seq.id); }}
                                                >
                                                    Import JSON
                                                </SchemaImportBtn>
                                                <input
                                                    ref={el => { fileInputRefs.current[seq.id] = el; }}
                                                    type="file"
                                                    accept=".json"
                                                    style={{ display: 'none' }}
                                                    onChange={e => handleFileChange(seq.id, e)}
                                                />
                                            </SchemaRow>
                                            {schemaErrors[seq.id] && (
                                                <SchemaError>{schemaErrors[seq.id]}</SchemaError>
                                            )}
                                        </CustomInputsContainer>
                                    )}
                                </SequenceItem>
                            ))}
                        </SequencesList>
                    )}
                </DialogField>

                <DialogButtonGroup>
                    <DialogCancelBtn onClick={onCancel}>Cancel</DialogCancelBtn>
                    {selectedIds.size > 0 && (
                        <SelectionInfo>
                            {selectedIds.size} sequence{selectedIds.size !== 1 ? 's' : ''} selected
                        </SelectionInfo>
                    )}
                    <DialogAddBtn onClick={handleConfirm} disabled={selectedIds.size === 0 || hasSchemaErrors}>
                        Add Selected Tools ({selectedIds.size})
                    </DialogAddBtn>
                </DialogButtonGroup>
            </DialogContent>
        </DialogOverlay>
    );
}

// XML Generation 
function generateMCPLocalEntryXml(serverName: string, tools: SequenceTool[]): string {
    let toolsXml = '';
    tools.forEach(tool => {
        toolsXml += `
            <tool name="${tool.name}">
                <sequence>${tool.sequenceName}</sequence>
                <description>${tool.description || tool.sequenceName}</description>
                <inputSchema>${tool.inputSchema}</inputSchema>
            </tool>`;
    });

    return `
        <mcptools>${toolsXml}
        </mcptools>`;
}

//  Form Schema 

const formSchema = yup.object({
    serverName: yup.string()
        .required('Server name is required')
        .min(3, 'Server name must be at least 3 characters')
        .matches(/^[a-zA-Z0-9_-]+$/, 'Server name can only contain letters, numbers, hyphens, and underscores'),
    port: yup.number()
        .typeError('Port must be a number')
        .required('Port is required')
        .integer('Port must be an integer'),
});

//  Main Form 

export interface MCPServerFromSequencesFormProps {
    path: string;
}

export function MCPServerFromSequencesForm({ path }: MCPServerFromSequencesFormProps) {
    const { rpcClient } = useVisualizerContext();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(formSchema),
        defaultValues: { serverName: '', port: 8300 },
    });

    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [tools, setTools] = useState<SequenceTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDialog, setShowDialog] = useState(false);

    // Load sequences from project structure
    useEffect(() => {
        const loadSequences = async () => {
            try {
                setLoading(true);
                setError(null);

                let projectUri = path;
                const artifactsIndex = projectUri.indexOf('/artifacts');
                if (artifactsIndex !== -1) {
                    projectUri = projectUri.substring(0, artifactsIndex).replace(/\/src\/main\/wso2mi$/, '');
                }

                const projectStructure = await rpcClient.getMiVisualizerRpcClient().getProjectStructure({
                    documentUri: projectUri
                });

                const sequenceArtifacts: any[] =
                    projectStructure?.directoryMap?.src?.main?.wso2mi?.artifacts?.sequences || [];

                const parsed: Sequence[] = sequenceArtifacts.map((art: any) => ({
                    id: art.name || art.id || art.fileName || '',
                    name: art.name || art.id || art.fileName || '',
                    xmlPath: art.path || '',
                })).filter(s => s.id !== '');

                if (parsed.length === 0) {
                    setError('No sequences found in the project');
                }
                setSequences(parsed);
            } catch (err) {
                setError(`Failed to load sequences: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        loadSequences();
    }, [rpcClient, path]);

    const handleDialogConfirm = (selected: Array<{ sequenceId: string; customName: string; description: string; inputSchema: string }>) => {
        const newTools: SequenceTool[] = selected
            .filter(s => !tools.some(t => t.sequenceName === s.sequenceId)) // avoid duplicates
            .map(s => ({
                id: crypto.randomUUID() as string,
                name: s.customName,
                description: s.description,
                sequenceName: s.sequenceId,
                sequenceXmlPath: sequences.find(seq => seq.id === s.sequenceId)?.xmlPath || '',
                inputSchema: s.inputSchema,
            }));
        setTools(prev => [...prev, ...newTools]);
        setShowDialog(false);
        setError(null);
    };

    const removeTool = (toolId: string) => {
        setTools(tools.filter(t => t.id !== toolId));
    };

    const onSubmit = async (data: any) => {
        if (tools.length === 0) {
            setError('Please add at least one tool');
            return;
        }

        setSubmitting(true);
        try {
            setError(null);

            const projectRootResp = await rpcClient.getMiDiagramRpcClient().getProjectRoot({ path });
            const projectDir = projectRootResp.path;

            const localEntriesDir = pathModule.join(projectDir, 'src', 'main', 'wso2mi', 'artifacts', 'local-entries').toString();
            const inboundEndpointsDir = pathModule.join(projectDir, 'src', 'main', 'wso2mi', 'artifacts', 'inbound-endpoints').toString();

            const localEntryName = `${data.serverName}-mcp-config`;
            const localEntryXml = generateMCPLocalEntryXml(data.serverName, tools);

            await rpcClient.getMiDiagramRpcClient().createLocalEntry({
                directory: localEntriesDir,
                name: localEntryName,
                type: 'In-Line XML Entry',
                value: localEntryXml,
                URL: '',
                getContentOnly: false
            });

            await rpcClient.getMiDiagramRpcClient().createInboundEndpoint({
                directory: inboundEndpointsDir,
                attributes: {
                    name: `${data.serverName}-endpoint`,
                    sequence: '',
                    onError: '',
                    class: 'org.wso2.carbon.inbound.SSE.McpInboundListener'
                },
                parameters: {
                    'inbound.mcp.port': data.port,
                    'inbound.http.port': data.port,
                    'inbound.http.context': '/mcp',
                    'mcp.tools.localentry': localEntryName,
                    'inbound.behavior': 'listening'
                }
            });

            rpcClient.getMiVisualizerRpcClient().showNotification({
                message: `MCP Server "${data.serverName}" created successfully with ${tools.length} tool(s)`,
                type: 'info'
            });
        } catch (err) {
            console.error('Error creating MCP Server:', err);
            setError(`Failed to create MCP Server: ${err instanceof Error ? err.message : String(err)}`);
            return;
        } finally {
            setSubmitting(false);
        }

        rpcClient.getMiVisualizerRpcClient().openView({
            type: EVENT_TYPE.OPEN_VIEW,
            location: { view: MACHINE_VIEW.MCPServerList, documentUri: path }
        });
    };

    return (
        <View>
            <ViewHeader title="Create MCP Server from Sequences" icon="server" />
            <ViewContent padding>
                <Container>
                    <div>
                        <Title>Create Tools from Sequences</Title>
                        <Description>
                            Add tools by selecting sequences in your project and giving them custom names and descriptions.
                        </Description>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
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

                        <FormSection>
                            <SectionLabel>Port</SectionLabel>
                            <TextField
                                placeholder="e.g., 8300"
                                {...register('port')}
                            />
                            {errors.port && (
                                <ErrorMessage>{String(errors.port?.message)}</ErrorMessage>
                            )}
                        </FormSection>

                        <FormSection>
                            <ToolsSectionHeader>
                                <SectionLabel>Tools ({tools.length})</SectionLabel>
                                <AddToolMainBtn
                                    type="button"
                                    onClick={() => setShowDialog(true)}
                                    disabled={loading || sequences.length === 0}
                                    aria-label="Add tool"
                                >
                                    + Add Tool
                                </AddToolMainBtn>
                            </ToolsSectionHeader>

                            {tools.length === 0 ? (
                                <EmptyMessage>No tools added yet. Click "Add Tool" to select sequences.</EmptyMessage>
                            ) : (
                                <ToolsList>
                                    {tools.map(tool => (
                                        <ToolItem key={tool.id}>
                                            <ToolInfo>
                                                <ToolName>{tool.name}</ToolName>
                                                {tool.description && (
                                                    <ToolDescription>{tool.description}</ToolDescription>
                                                )}
                                            </ToolInfo>
                                            <ToolMeta>sequence: {tool.sequenceName}</ToolMeta>
                                            <RemoveBtn
                                                onClick={() => removeTool(tool.id)}
                                                aria-label={`Remove tool ${tool.name}`}
                                            >
                                                ✕
                                            </RemoveBtn>
                                        </ToolItem>
                                    ))}
                                </ToolsList>
                            )}
                        </FormSection>

                        {error && <ErrorMessage>{error}</ErrorMessage>}

                        <ButtonGroup>
                            <Button
                                appearance="secondary"
                                onClick={() => {
                                    rpcClient.getMiVisualizerRpcClient().openView({
                                        type: EVENT_TYPE.OPEN_VIEW,
                                        location: { view: MACHINE_VIEW.MCPServerList, documentUri: path }
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
                                {submitting
                                    ? 'Creating...'
                                    : `Create MCP Server (${tools.length} tool${tools.length !== 1 ? 's' : ''})`}
                            </Button>
                        </ButtonGroup>
                    </form>
                </Container>

                <AddSequenceToolDialog
                    isOpen={showDialog}
                    sequences={sequences}
                    onConfirm={handleDialogConfirm}
                    onCancel={() => setShowDialog(false)}
                />
            </ViewContent>
        </View>
    );
}

export default MCPServerFromSequencesForm;
