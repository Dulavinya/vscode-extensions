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
import { Button } from '@wso2/ui-toolkit';
import { EVENT_TYPE, MACHINE_VIEW } from '@wso2/mi-core';
import { useVisualizerContext } from '@wso2/mi-rpc-client';
import { View, ViewContent, ViewHeader } from '../../../components/View';

interface Tool {
    id: string;
    name: string;
    description: string;
    apiId: string;
    apiName: string;
    apiVersion: string;
    apiRawVersion: string;
    apiXmlPath: string;
    operationId: string;
    operationMethod: string;
    operationPath: string;
    operationSummary: string;
}

interface MCPServer {
    name: string;
    localEntryPath: string;
    toolCount: number;
    tools: Tool[];
}

//  Styled Components 

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
    max-width: 900px;
`;

const HeaderRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
`;

const Title = styled.h2`
    color: var(--vscode-editor-foreground);
    margin: 0;
    font-size: 20px;
    font-weight: 600;
`;

const Description = styled.p`
    color: var(--vscode-descriptionForeground);
    margin: 0 0 8px 0;
    font-size: 13px;
`;

const ServerList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ServerCard = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--vscode-focusBorder);
        background: var(--vscode-list-hoverBackground);
    }
`;

const ServerInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const ServerName = styled.span`
    font-weight: 600;
    font-size: 14px;
    color: var(--vscode-editor-foreground);
`;

const ServerMeta = styled.span`
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
`;

const StatusDot = styled.span`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--vscode-testing-iconPassed, #4caf50);
    display: inline-block;
    margin-right: 6px;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const EditBtn = styled.button`
    padding: 5px 12px;
    font-size: 12px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;

    &:hover {
        background: var(--vscode-button-hoverBackground);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const DeleteBtn = styled.button`
    padding: 5px 12px;
    font-size: 12px;
    background: var(--vscode-inputValidation-errorBackground, rgba(255, 0, 0, 0.1));
    color: var(--vscode-errorForeground, #f44336);
    border: 1px solid var(--vscode-inputValidation-errorBorder, #f44336);
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;

    &:hover {
        background: var(--vscode-inputValidation-errorBorder, #f44336);
        color: var(--vscode-button-foreground, #fff);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const EmptyState = styled.div`
    padding: 32px 20px;
    text-align: center;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
    border: 1px dashed var(--vscode-panel-border);
    border-radius: 6px;
`;

const LoadingState = styled.div`
    padding: 20px;
    text-align: center;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
`;

const ErrorMessage = styled.div`
    color: var(--vscode-inputValidation-errorBorder);
    padding: 10px;
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 4px;
    background: var(--vscode-inputValidation-errorBackground);
    font-size: 12px;
`;

//  Helpers 

function parseToolsFromLocalEntry(xmlContent: string): Tool[] {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        const toolElements = Array.from(doc.querySelectorAll('tool'));

        return toolElements.map(toolEl => {
            const method = toolEl.querySelector('method')?.textContent?.trim() || '';
            const resource = toolEl.querySelector('resource')?.textContent?.trim() || '';
            const description = toolEl.querySelector('description')?.textContent?.trim() || '';
            const api = toolEl.querySelector('api')?.textContent?.trim() || '';
            const name = toolEl.getAttribute('name') || '';

            return {
                id: crypto.randomUUID(),
                name,
                description,
                apiId: api,
                apiName: api,
                apiVersion: '1.0.0',
                apiRawVersion: '',
                apiXmlPath: '',
                operationId: `${method}_${resource}`.replace(/[^a-zA-Z0-9_]/g, '_'),
                operationMethod: method,
                operationPath: resource,
                operationSummary: description,
            };
        });
    } catch {
        return [];
    }
}

//  Component 

export interface MCPServerListProps {
    path: string;
}

export function MCPServerList({ path }: MCPServerListProps) {
    const { rpcClient } = useVisualizerContext();
    const [servers, setServers] = useState<MCPServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openingServer, setOpeningServer] = useState<string | null>(null);

    useEffect(() => {
        loadServers();
    }, [path]);

    const loadServers = async () => {
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

            const localEntries: any[] = projectStructure?.directoryMap?.src?.main?.wso2mi?.artifacts?.localEntries || [];
            const mcpLocalEntries = localEntries.filter((e: any) => e.name?.endsWith('-mcp-config'));

            const loadedServers: MCPServer[] = [];

            for (const entry of mcpLocalEntries) {
                const serverName = entry.name.replace(/-mcp-config$/, '');
                let tools: Tool[] = [];

                if (entry.path) {
                    try {
                        const resp = await rpcClient.getMiDiagramRpcClient().readIdpSchemaFileContent({ filePath: entry.path });
                        if (resp.fileContent) {
                            tools = parseToolsFromLocalEntry(resp.fileContent);
                        }
                    } catch {}
                }

                loadedServers.push({
                    name: serverName,
                    localEntryPath: entry.path || '',
                    toolCount: tools.length,
                    tools,
                });
            }

            setServers(loadedServers);
        } catch (err) {
            setError(`Failed to load MCP servers: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        rpcClient.getMiVisualizerRpcClient().openView({
            type: EVENT_TYPE.OPEN_VIEW,
            location: {
                view: MACHINE_VIEW.MCPServerForm,
                documentUri: path,
                customProps: { forceCreate: true }
            }
        });
    };

    const handleOpenServer = (server: MCPServer) => {
        setOpeningServer(server.name);
        rpcClient.getMiVisualizerRpcClient().openView({
            type: EVENT_TYPE.OPEN_VIEW,
            location: {
                view: MACHINE_VIEW.MCPServerFromAPIsForm,
                documentUri: path,
                customProps: {
                    editData: {
                        serverName: server.name,
                        tools: server.tools,
                    }
                }
            }
        });
    };

    const handleDeleteServer = (e: React.MouseEvent, server: MCPServer) => {
        e.stopPropagation();
        try {
            rpcClient.getMiDiagramRpcClient().deleteArtifact({ path: server.localEntryPath });
            setServers(prev => prev.filter(s => s.name !== server.name));
        } catch (err) {
            setError(`Failed to delete MCP server: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    return (
        <View>
            <ViewHeader title="MCP Servers" icon="server" />
            <ViewContent padding>
                <Container>
                    <div>
                        <HeaderRow>
                            <Title>MCP Servers</Title>
                            <Button appearance="primary" onClick={handleCreateNew}>
                                + Create New
                            </Button>
                        </HeaderRow>
                        <Description>
                            Manage your MCP servers. Click a server to view or edit its configuration.
                        </Description>
                    </div>

                    {loading && <LoadingState>Loading MCP servers...</LoadingState>}
                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    {!loading && !error && servers.length === 0 && (
                        <EmptyState>
                            No MCP servers found. Click "Create New" to create one.
                        </EmptyState>
                    )}

                    {!loading && servers.length > 0 && (
                        <ServerList>
                            {servers.map(server => (
                                <ServerCard key={server.name} onClick={() => handleOpenServer(server)}>
                                    <ServerInfo>
                                        <ServerName>
                                            <StatusDot />
                                            {server.name}
                                        </ServerName>
                                        <ServerMeta>
                                            {server.toolCount} tool{server.toolCount !== 1 ? 's' : ''}
                                        </ServerMeta>
                                    </ServerInfo>
                                    <ActionButtons>
                                        <EditBtn
                                            onClick={e => { e.stopPropagation(); handleOpenServer(server); }}
                                            disabled={openingServer === server.name}
                                        >
                                            {openingServer === server.name ? 'Opening...' : 'Edit'}
                                        </EditBtn>
                                        <DeleteBtn
                                            onClick={e => handleDeleteServer(e, server)}
                                        >
                                            Delete
                                        </DeleteBtn>
                                    </ActionButtons>
                                </ServerCard>
                            ))}
                        </ServerList>
                    )}
                </Container>
            </ViewContent>
        </View>
    );
}

export default MCPServerList;
