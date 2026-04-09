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
import { MACHINE_VIEW, EVENT_TYPE } from '@wso2/mi-core';
import { useVisualizerContext } from '@wso2/mi-rpc-client';
import { View, ViewContent, ViewHeader } from '../../../components/View';

// Styled components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 28px;
    flex: 1;
    padding-top: 16px;
`;

const Title = styled.h2`
    color: var(--vscode-editor-foreground);
    margin: 0 0 30px 0;
    font-size: 24px;
    font-weight: 600;
`;

const Description = styled.p`
    color: var(--vscode-descriptionForeground);
    margin: 0 0 20px 0;
    font-size: 14px;
    line-height: 1.6;
`;

const OptionsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    max-width: 900px;
    margin: 0 auto;
    flex: 1;
`;

const OptionCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
    min-height: 260px; 
    max-height: 300px; 
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    background: var(--vscode-editor-background);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        background: var(--vscode-panel-background);
        transform: translateY(-2px);
    }
`;

const OptionIcon = styled.span`
    font-size: 28px;
    color: var(--vscode-editor-foreground);
    opacity: 0.9;
`;


const OptionTitle = styled.h3`
    color: var(--vscode-editor-foreground);
    margin: 0;
    font-size: 16px;
    font-weight: 600;
`;

const OptionDescription = styled.p`
    color: var(--vscode-descriptionForeground);
    margin: 0;
    font-size: 13px;
    max-width: 90%; 
    line-height: 1.5;
    flex: 1;
`;

const StyledButton = styled(Button)`
    width: fit-content;
    align-self: flex-start;
    margin-top: auto;
`;

export interface MCPServerWizardProps {
    path: string;
    forceCreate?: boolean;
}

export function MCPServerWizard({ path, forceCreate }: MCPServerWizardProps) {
    const { rpcClient } = useVisualizerContext();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(!forceCreate);

    // On mount, redirect to the list if servers already exist (unless forced to create)
    useEffect(() => {
        if (forceCreate) return;

        const checkExistingServers = async () => {
            try {
                let projectUri = path;
                const artifactsIndex = projectUri.indexOf('/artifacts');
                if (artifactsIndex !== -1) {
                    projectUri = projectUri.substring(0, artifactsIndex).replace(/\/src\/main\/wso2mi$/, '');
                }

                const projectStructure = await rpcClient.getMiVisualizerRpcClient().getProjectStructure({
                    documentUri: projectUri
                });

                const localEntries: any[] = projectStructure?.directoryMap?.src?.main?.wso2mi?.artifacts?.localEntries || [];
                const hasMCPServers = localEntries.some((e: any) => e.name?.endsWith('-mcp-config'));

                if (hasMCPServers) {
                    rpcClient.getMiVisualizerRpcClient().openView({
                        type: EVENT_TYPE.OPEN_VIEW,
                        location: { view: MACHINE_VIEW.MCPServerList, documentUri: path }
                    });
                    return;
                }
            } catch {
                // If check fails, stay on the wizard
            }
            setChecking(false);
        };

        checkExistingServers();
    }, []);

    const handleCreateFromAPIs = async () => {
        setLoading(true);
        try {
            //navigation to the MCPServerFromAPIs Form view
            rpcClient.getMiVisualizerRpcClient().openView({
                type: EVENT_TYPE.OPEN_VIEW,
                location: {
                    view: MACHINE_VIEW.MCPServerFromAPIsForm,
                    documentUri: path
                }
            });
        } catch (error) {
            console.error('Error navigating to APIs form:', error);
        } finally {
            setLoading(false);
        }
    };

    
    const handleCreateFromSequences = async () => {
        setLoading(true);
        try {
            rpcClient.getMiVisualizerRpcClient().openView({
                type: EVENT_TYPE.OPEN_VIEW,
                location: {
                    view: MACHINE_VIEW.MCPServerFromSequencesForm,
                    documentUri: path
                }
            });
        } catch (error) {
            console.error('Error navigating to Sequences form:', error);
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return null;
    }

    return (
        <View>
            <ViewHeader title="Create MCP Server" icon="server" />
            <ViewContent padding>
                <Container>
                    <div>
                        <Title>Select MCP Server Type</Title>
                        <Description>
                            Choose how you want to create your MCP server.
                        </Description>
                    </div>

                    <OptionsContainer>
                        {/* Option 1: Create from Existing APIs */}
                        <OptionCard onClick={handleCreateFromAPIs}>
                            {/* <OptionIcon className="codicon codicon-symbol-method" /> */}

                            <OptionTitle>From Existing APIs</OptionTitle>
                            <OptionDescription>
                                Generate an MCP server configuration by selecting existing APIs in your project.
                            </OptionDescription>
                            <StyledButton appearance="primary" disabled={loading}>
                                {loading ? 'Loading...' : 'Select APIs'}
                            </StyledButton>
                        </OptionCard>

                        {/* Option 2: Create from Existing Sequences */}
                        <OptionCard onClick={handleCreateFromSequences}>
                            <OptionTitle>From Existing Sequences</OptionTitle>
                            <OptionDescription>
                                Generate an MCP server configuration by selecting existing sequences in your project.
                            </OptionDescription>
                            <StyledButton appearance="primary" disabled={loading}>
                                {loading ? 'Loading...' : 'Select Sequences'}
                            </StyledButton>
                        </OptionCard>
                    </OptionsContainer>
                </Container>
            </ViewContent>
        </View>
    );
}

export default MCPServerWizard;