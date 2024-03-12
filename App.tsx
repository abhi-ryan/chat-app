import React, { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
    Button,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
    NativeModules,
    DeviceEventEmitter,
    PermissionsAndroid,
    TextInput,
    Alert,
} from 'react-native';

import {
    Colors,
    DebugInstructions,
    Header,
    LearnMoreLinks,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
    title: string;
}>;

interface Message {
    content: string;
    role: string;
}

interface ChatResult {
    created_at: string;
    done: boolean;
    eval_count: number;
    eval_duration: number;
    load_duration: number;
    message: Message;
    model: string;
    prompt_eval_duration: number;
    total_duration: number;
}

const getGeoLocationAccess = () => {
    return PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ).then(async result => {
        if (result) {
            console.log('You can use the location');
            return;
        }
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            {
                title: 'Location Permission',
                message: 'We need your location',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        console.log('granted', granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('You can use the location');
        } else {
            console.log('Location permission denied');
        }
    });
};

const ML_API_ENDPOINT = 'http://100.98.25.33:8080';

const fetchChatResult = async (prompt: string): Promise<ChatResult> => {
    try {
        console.log(`fetchChatResult: ${ML_API_ENDPOINT}`);
        const chatResult: Response = await fetch(
            `${ML_API_ENDPOINT}/api/chat`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama2',
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    stream: false,
                }),
            },
        );
        console.log(chatResult);
        if (!chatResult.ok) {
            console.log('chatResult.status: ', chatResult.status);
            throw new Error('Error fetching chat result');
        }
        const chatResultJson: ChatResult = await chatResult.json();
        console.log(chatResultJson);
        return chatResultJson;
    } catch (error) {
        console.error('Error fetching chat result: ', error);
        throw new Error('Error fetching chat result');
    }
};

function ChatComponent(): React.JSX.Element {
    const [chatPrompt, setChatPrompt] = useState('');
    const [chatResult, setChatResult] = useState('');
    const [isLoadingChatResult, setIsLoadingChatResult] = useState(false);

    const isDarkMode = useColorScheme() === 'dark';

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };

    useEffect(() => {
        console.log('Start App!!!');
    }, []);

    useEffect(() => {
        if (isLoadingChatResult) {
            console.log('loading!!!');
        } else {
            console.log('not loading!!!');
        }
    }, [isLoadingChatResult]);

    const getChatResult = async () => {
        setIsLoadingChatResult(true);
        try {
            setChatResult('Fetching chat result...');
            const chatResult = await fetchChatResult(chatPrompt);
            console.log('chatResult: ', chatResult);
            setChatResult(chatResult.message.content);
        } catch (error: any) {
            Alert.alert(error.message);
        }
        setIsLoadingChatResult(false);
    };

    const handleChatPromptChange = (text: string) => {
        setChatPrompt(text);
    };

    return (
        <SafeAreaView style={backgroundStyle}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={backgroundStyle.backgroundColor}
            />
            <View>
                <Text>Chat App</Text>
                <TextInput
                    style={{
                        borderColor: 'gray',
                        borderWidth: 2,
                        padding: 10,
                    }}
                    multiline={true}
                    numberOfLines={10}
                    onChangeText={handleChatPromptChange}
                />
            </View>
            <Button
                onPress={getChatResult}
                title="Get results"
                color={Colors.primary}
                accessibilityLabel="Get Location Access"
            />
            {chatResult && chatResult.length > 0 && (
                <>
                    <Text>Result:</Text>
                    <ScrollView
                        contentInsetAdjustmentBehavior="automatic"
                        style={{
                            height: 400,
                        }}>
                        <View
                            style={{
                                backgroundColor: isDarkMode
                                    ? Colors.black
                                    : Colors.white,
                            }}>
                            <Text>{chatResult}</Text>
                        </View>
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
}

function App(): React.JSX.Element {
    return <ChatComponent />;
}

export default App;
