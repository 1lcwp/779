import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  StyleSheet,
  Modal,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function App() {
  const [saldo, setSaldo] = useState(0);
  const [inputSaldo, setInputSaldo] = useState('');
  const [investimento, setInvestimento] = useState('');
  const [odd, setOdd] = useState('');
  const [historico, setHistorico] = useState([]);
  const [apostas, setApostas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [modalCashout, setModalCashout] = useState(false);
  const [cashoutValue, setCashoutValue] = useState('');
  const [selectedCashId, setSelectedCashId] = useState(null);

  const editarSaldo = () => {
    const novo = parseFloat(inputSaldo);
    if (!isNaN(novo)) {
      setSaldo(novo);
      setHistorico([novo]);
      setInputSaldo('');
      setApostas([]);
    }
  };

  const reiniciarGrafico = () => {
    const base = historico[0] || saldo;
    setHistorico([base]);
    const apostasReset = apostas.map((aposta) => ({
      ...aposta,
      status: 'espera',
      cashout: null,
      valorGrafico: 0,
    }));
    setApostas(apostasReset);
  };

  const atualizarHistorico = (apostasAtualizadas, base) => {
    const novoHistorico = [base];
    apostasAtualizadas.forEach((a) => {
      novoHistorico.push(
        novoHistorico[novoHistorico.length - 1] + a.valorGrafico
      );
    });
    return novoHistorico;
  };

  const atualizarStatus = (id, novoStatus, valorCash = null) => {
    const novasApostas = apostas.map((aposta) => {
      if (aposta.id === id) {
        let valor = 0;
        if (novoStatus === 'green') valor = aposta.investimento * aposta.odd;
        else if (novoStatus === 'red') valor = -aposta.investimento;
        else if (novoStatus === 'cashout' && valorCash !== null) {
          valor = valorCash;
          aposta.cashout = valorCash;
        }
        aposta.status = novoStatus;
        aposta.valorGrafico = valor;
      }
      return aposta;
    });

    const base = historico[0] || saldo;
    const novoHistorico = atualizarHistorico(novasApostas, base);
    setApostas(novasApostas);
    setSaldo(novoHistorico[novoHistorico.length - 1]);
    setHistorico(novoHistorico);
  };

  const adicionarAposta = () => {
    if (!investimento || !odd) {
      Alert.alert('Erro', 'Preencha odd e investimento');
      return;
    }
    const nova = {
      id: Date.now().toString(),
      investimento: parseFloat(investimento),
      odd: parseFloat(odd),
      status: 'espera',
      cashout: null,
      valorGrafico: 0,
    };
    const novasApostas = [nova, ...apostas];
    setApostas(novasApostas);
    const base = historico[0] || saldo;
    const novoHistorico = atualizarHistorico(novasApostas, base);
    setHistorico(novoHistorico);
    setInvestimento('');
    setOdd('');
  };

  const apagarAposta = (id) => {
    const novasApostas = apostas.filter((a) => a.id !== id);
    const base = historico[0] || saldo;
    const novoHistorico = atualizarHistorico(novasApostas, base);
    setApostas(novasApostas);
    setSaldo(novoHistorico[novoHistorico.length - 1]);
    setHistorico(novoHistorico);
  };

  const renderItem = ({ item }) => {
    const expandida = expandedId === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedId(expandida ? null : item.id)}>
        <Text style={styles.text}>Odd: {item.odd.toFixed(2)}</Text>
        <Text style={styles.text}>
          Investimento: R$ {item.investimento.toFixed(2)}
        </Text>
        {expandida && (
          <View>
            <Text style={styles.text}>Status: {item.status}</Text>
            {item.cashout !== null && (
              <Text style={styles.text}>
                Cashout: R$ {item.cashout.toFixed(2)}
              </Text>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.buttonGreen}
                onPress={() => atualizarStatus(item.id, 'green')}>
                <Text style={styles.buttonText}>GREEN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonRed}
                onPress={() => atualizarStatus(item.id, 'red')}>
                <Text style={styles.buttonText}>RED</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonCashout}
                onPress={() => {
                  setSelectedCashId(item.id);
                  setCashoutValue('');
                  setModalCashout(true);
                }}>
                <Text style={styles.buttonText}>CASHOUT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonDelete}
                onPress={() => apagarAposta(item.id)}>
                <Text style={styles.buttonText}>APAGAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const saldoBase = historico[0] || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ alignItems: 'center' }}>
      <View style={styles.saldoContainer}>
        <Text style={styles.saldoTexto}>Saldo: R$ {saldo.toFixed(2)}</Text>
        <View style={styles.editarSaldoRow}>
          <TextInput
            placeholder="Saldo Inicial"
            value={inputSaldo}
            onChangeText={setInputSaldo}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={editarSaldo} style={styles.editarButton}>
            <Ionicons name="checkmark" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={reiniciarGrafico}
            style={styles.resetButton}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {historico.length > 0 && (
        <LineChart
          data={{
            labels: historico.map((_, i) => (i % 2 === 0 ? i.toString() : '')),
            datasets: [{ data: historico }],
            legend: [`Saldo Inicial: R$ ${saldoBase.toFixed(2)}`],
          }}
          width={screenWidth * 0.99}
          height={180}
          yLabelsOffset={12}
          withInnerLines={true}
          fromZero={false}
          yAxisSuffix=" R$"
          chartConfig={{
            backgroundColor: '#121212',
            backgroundGradientFrom: '#121212',
            backgroundGradientTo: '#121212',
            decimalPlaces: 2,
            color: () => `#00e676`,
            labelColor: () => '#ccc',
            propsForLabels: { fontSize: 9 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#00e676' },
          }}
          bezier
          style={{ borderRadius: 16, marginVertical: 16 }}
        />
      )}

      <Text style={styles.titulo}>Nova Aposta</Text>
      <TextInput
        placeholder="Odd"
        value={odd}
        onChangeText={setOdd}
        keyboardType="numeric"
        style={styles.input}
        placeholderTextColor="#aaa"
      />
      <TextInput
        placeholder="Investimento"
        value={investimento}
        onChangeText={setInvestimento}
        keyboardType="numeric"
        style={styles.input}
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity
        onPress={adicionarAposta}
        style={styles.adicionarButton}>
        <Text style={styles.buttonText}>Adicionar Aposta</Text>
      </TouchableOpacity>

      <FlatList
        data={apostas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ width: '100%' }}
        contentContainerStyle={{ alignItems: 'center' }}
      />

      <Modal visible={modalCashout} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.titulo}>Valor de Cashout:</Text>
            <TextInput
              placeholder="Ex: 25.00"
              value={cashoutValue}
              onChangeText={setCashoutValue}
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              onPress={() => {
                const valor = parseFloat(cashoutValue);
                if (!isNaN(valor)) {
                  atualizarStatus(selectedCashId, 'cashout', valor);
                  setModalCashout(false);
                }
              }}
              style={[styles.adicionarButton, { backgroundColor: '#00e676' }]}>
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalCashout(false)}
              style={styles.resetButton}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  saldoContainer: {
    marginTop: 30,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    width: '90%',
  },
  saldoTexto: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  editarSaldoRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  input: {
    backgroundColor: '#2c2c2c',
    color: 'white',
    padding: 10,
    borderRadius: 10,
    marginVertical: 8,
    width: '40%',
    marginRight: 8,
  },
  editarButton: { backgroundColor: '#00c853', padding: 10, borderRadius: 10 },
  resetButton: {
    backgroundColor: '#ff6d00',
    padding: 10,
    marginLeft: 10,
    borderRadius: 10,
  },
  titulo: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  adicionarButton: {
    backgroundColor: '#2962ff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    width: '90%',
  },
  text: { color: 'white', fontSize: 16 },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonGreen: {
    backgroundColor: '#00e676',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  buttonRed: {
    backgroundColor: '#d50000',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  buttonCashout: {
    backgroundColor: '#ffab00',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  buttonDelete: {
    backgroundColor: '#757575',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    width: '85%',
  },
});
