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
import { Dropdown } from 'react-native-element-dropdown';

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

interface ChatModelDetails {
    format: string;
    family: string;
    families: null | any[];
    parameter_size: string;
    quantization_level: string;
}

interface ChatModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: ChatModelDetails;
}

interface AllChatModels {
    models: ChatModel[];
}

interface DropDownItem {
    label: string;
    value: string;
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

const fetchAllChatModels = async (): Promise<AllChatModels> => {
    try {
        console.log(`fetchAllChatModels: ${ML_API_ENDPOINT}`);
        const chatModels: Response = await fetch(`${ML_API_ENDPOINT}/api/tags`);
        console.log(chatModels);
        if (!chatModels.ok) {
            console.log('chatModels.status: ', chatModels.status);
            throw new Error('Error fetching all chat models');
        }
        const chatModelsJson: AllChatModels = await chatModels.json();
        console.log(chatModelsJson);
        return chatModelsJson;
    } catch (error) {
        console.error('Error fetching chat models: ', error);
        throw new Error('Error fetching all chat models');
    }
};

const fetchChatResult = async (
    prompt: string,
    model: string,
): Promise<ChatResult> => {
    try {
        console.log(`fetchChatResult: ${ML_API_ENDPOINT}`);
        const chatResult: Response = await fetch(
            `${ML_API_ENDPOINT}/api/chat`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
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
    const [chatPrompt, setChatPrompt] = useState<string>('');
    const [chatResult, setChatResult] = useState<string>('');
    const [isLoadingChatResult, setIsLoadingChatResult] =
        useState<boolean>(false);
    const [chatModels, setChatModels] = useState<DropDownItem[]>([]);
    const [selectedChatModel, setSelectedChatModel] =
        useState<string>('llama2');
    const [dropDownFocus, setDropDownFocus] = useState<boolean>(false);

    const isDarkMode = useColorScheme() === 'dark';

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };

    useEffect(() => {
        if (isLoadingChatResult) {
            console.log('loading!!!');
        } else {
            console.log('not loading!!!');
        }
    }, [isLoadingChatResult]);

    const getAllChatModels = async () => {
        try {
            const chatModels: AllChatModels = await fetchAllChatModels();
            const chatModelsTags: DropDownItem[] = chatModels.models.map(
                (item: ChatModel) => {
                    return {
                        label: item.name,
                        value: item.name,
                    } as DropDownItem;
                },
            );
            setChatModels(chatModelsTags);
            console.log('chatModels: ', chatModelsTags);
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    const getChatResult = async () => {
        setIsLoadingChatResult(true);
        try {
            setChatResult('Fetching chat result...');
            const chatResult = await fetchChatResult(
                chatPrompt,
                selectedChatModel,
            );
            console.log('chatResult: ', chatResult);
            setChatResult(chatResult.message.content);
        } catch (error: any) {
            Alert.alert(error.message);
            setChatResult('Error fetching chat result');
        }
        setIsLoadingChatResult(false);
    };

    const handlChatModelChange = (text: string) => {
        console.log(text);
    };

    const handleChatPromptChange = (text: string) => {
        setChatPrompt(text);
    };

    useEffect(() => {
        console.log('Start App!!!');
        getAllChatModels();
    }, []);

    const dropDownStyle = StyleSheet.create({
        dropdown: {
            height: 50,
            borderColor: isDarkMode ? Colors.white : Colors.black,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 8,
            marginTop: 8,
            marginBottom: 8,
        },
        containerStyle: {
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
        },
        label: {
            position: 'absolute',
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            left: 22,
            top: 8,
            zIndex: 999,
            paddingHorizontal: 8,
            fontSize: 14,
        },
        placeholderStyle: {
            fontSize: 16,
        },
        selectedTextStyle: {
            fontSize: 16,
            color: isDarkMode ? Colors.white : Colors.black,
        },
        itemTextStyle: {
            fontSize: 16,
            color: isDarkMode ? Colors.white : Colors.black,
        },
        inputSearchStyle: {
            height: 40,
            fontSize: 16,
        },
    });

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
            <View>
                <Dropdown
                    style={[dropDownStyle.dropdown]}
                    placeholderStyle={dropDownStyle.placeholderStyle}
                    selectedTextStyle={dropDownStyle.selectedTextStyle}
                    itemTextStyle={dropDownStyle.itemTextStyle}
                    inputSearchStyle={dropDownStyle.inputSearchStyle}
                    containerStyle={dropDownStyle.containerStyle}
                    data={chatModels}
                    search
                    maxHeight={300}
                    // @ts-ignore
                    labelField="label"
                    valueField="value"
                    placeholder={selectedChatModel}
                    searchPlaceholder="Search..."
                    value={selectedChatModel}
                    onFocus={() => setDropDownFocus(true)}
                    onBlur={() => setDropDownFocus(false)}
                    onChange={(item: DropDownItem) => {
                        setSelectedChatModel(item.value);
                    }}
                    // renderLeftIcon={() => (
                    //     <AntDesign
                    //         style={styles.icon}
                    //         color={isFocus ? 'blue' : 'black'}
                    //         name="Safety"
                    //         size={20}
                    //     />
                    // )}
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
